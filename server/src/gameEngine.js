// gameEngine.js - Core game logic for Buckshot Roulette
import { ITEM_TYPES, ITEMS_INFO } from './items.js';

const ALL_ITEM_KEYS = Object.keys(ITEM_TYPES).map(k => ITEM_TYPES[k]);

export class GameEngine {
  constructor() {
    this.rooms = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(hostSocketId, nickname, initialHp = '', initialItems = '', reloadItems = '') {
    let code = this.generateRoomCode();
    while (this.rooms.has(code)) {
      code = this.generateRoomCode();
    }

    const room = {
      code,
      hostId: hostSocketId,
      config: { initialHp, initialItems, reloadItems },
      players: [
        {
          socketId: hostSocketId,
          nickname: nickname || 'Player 1',
          hp: 4,
          maxHp: 4,
          items: [],
          handcuffed: false,
          mirrorActive: false
        }
      ],
      turnIndex: 0,
      round: 1,
      shells: [],
      currentIndex: 0,
      liveCount: 0,
      blankCount: 0,
      sawActive: false,
      contractActive: false,
      lockActive: false,
      status: 'waiting',
      winner: null,
      logs: [],
      lastAction: null
    };

    this.rooms.set(code, room);
    return room;
  }

  joinRoom(code, socketId, nickname) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      return { error: 'Phòng không tồn tại!' };
    }
    if (room.players.length >= 2) {
      return { error: 'Phòng đã đủ 2 người chơi!' };
    }

    room.players.push({
      socketId,
      nickname: nickname || 'Player 2',
      hp: 4,
      maxHp: 4,
      items: [],
      handcuffed: false,
      mirrorActive: false
    });

    this.startGame(room);
    return { room };
  }

  getRoom(code) {
    return this.rooms.get(code?.toUpperCase());
  }

  removePlayer(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const pIndex = room.players.findIndex(p => p.socketId === socketId);
      if (pIndex !== -1) {
        const leavingPlayer = room.players[pIndex];
        room.players.splice(pIndex, 1);

        if (room.players.length === 0) {
          this.rooms.delete(code);
        } else {
          room.status = 'waiting';
          room.winner = null;
          room.currentIndex = 0;
          room.sawActive = false;
          room.contractActive = false;
          room.lockActive = false;
          room.lastAction = null;
          room.logs = [];
          this.addLog(room, `⚠️ ${leavingPlayer.nickname} đã thoát phòng. Đang chờ người chơi mới...`);
        }
        return { code, room };
      }
    }
    return null;
  }

  leaveRoom(code, socketId) {
    const room = this.rooms.get(code?.toUpperCase());
    if (!room) return null;
    return this.removePlayer(socketId);
  }

  startGame(room) {
    room.status = 'playing';
    room.round = 1;
    room.turnIndex = Math.floor(Math.random() * 2);

    let startHp = room.config?.initialHp !== '' && room.config?.initialHp !== undefined ? parseInt(room.config.initialHp) : null;
    if (startHp === null || isNaN(startHp) || startHp < 1) {
      startHp = Math.floor(Math.random() * 4) + 3;
    }

    room.players.forEach(p => {
      p.maxHp = startHp;
      p.hp = startHp;
      p.items = [];
      p.handcuffed = false;
      p.mirrorActive = false;
    });

    this.loadNewRound(room, true);
  }

  loadNewRound(room, isGameStart = false) {
    room.logs = [];
    room.sawActive = false;
    room.contractActive = false;
    room.lockActive = false;
    room.currentIndex = 0;

    const totalShells = Math.floor(Math.random() * 5) + 3;
    let live = Math.floor(Math.random() * (totalShells - 1)) + 1;
    let blank = totalShells - live;
    if (blank === 0) {
      blank = 1;
      live--;
    }

    room.liveCount = live;
    room.blankCount = blank;

    const array = [];
    for (let i = 0; i < live; i++) array.push('live');
    for (let i = 0; i < blank; i++) array.push('blank');

    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    room.shells = array;

    room.players.forEach(p => {
      p.mirrorActive = false;
      let countToGive = 0;

      if (isGameStart) {
        if (room.config?.initialItems !== '' && room.config?.initialItems !== undefined) {
          countToGive = parseInt(room.config.initialItems);
          if (isNaN(countToGive) || countToGive < 0) countToGive = Math.floor(Math.random() * 3);
        } else {
          countToGive = Math.floor(Math.random() * 3);
        }
      } else {
        if (room.config?.reloadItems !== '' && room.config?.reloadItems !== undefined) {
          countToGive = parseInt(room.config.reloadItems);
          if (isNaN(countToGive) || countToGive < 0) countToGive = Math.floor(Math.random() * 3);
        } else {
          countToGive = Math.floor(Math.random() * 3);
        }
      }

      for (let i = 0; i < countToGive; i++) {
        if (p.items.length < 8) {
          const randomItem = ALL_ITEM_KEYS[Math.floor(Math.random() * ALL_ITEM_KEYS.length)];
          p.items.push(randomItem);
        }
      }
    });

    if (!isGameStart) {
      room.round += 1;
    }

    this.addLog(room, `🔄 BẮT ĐẦU ĐỢT ĐẠN MỚI (ROUND ${room.round})`);
    this.addLog(room, `🔴 Đạn THẬT: ${live} | 🔵 Đạn GIẢ: ${blank}`);
    this.addLog(room, `👉 ${room.players[room.turnIndex].nickname} đi trước.`);
  }

  addLog(room, text) {
    room.logs.push({
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text
    });
    if (room.logs.length > 30) room.logs.shift();
  }

  switchTurn(room) {
    const nextTurnIndex = (room.turnIndex + 1) % 2;
    const nextPlayer = room.players[nextTurnIndex];

    if (nextPlayer.handcuffed) {
      nextPlayer.handcuffed = false;
      this.addLog(room, `⛓️ ${nextPlayer.nickname} đang bị CÒNG TAY! Mất lượt!`);
    } else {
      room.turnIndex = nextTurnIndex;
    }
  }

  getSanitizedState(room, forSocketId) {
    return {
      code: room.code,
      status: room.status,
      round: room.round,
      turnIndex: room.turnIndex,
      turnSocketId: room.players[room.turnIndex]?.socketId,
      isMyTurn: room.players[room.turnIndex]?.socketId === forSocketId,
      sawActive: room.sawActive,
      contractActive: room.contractActive,
      lockActive: room.lockActive,
      liveCount: room.liveCount,
      blankCount: room.blankCount,
      totalShellsRemaining: room.shells.length - room.currentIndex,
      currentIndex: room.currentIndex,
      winner: room.winner,
      logs: room.logs,
      lastAction: room.lastAction,
      players: room.players.map(p => ({
        socketId: p.socketId,
        nickname: p.nickname,
        hp: p.hp,
        maxHp: p.maxHp,
        handcuffed: p.handcuffed,
        mirrorActive: p.mirrorActive,
        itemsCount: p.items.length,
        items: [...p.items]
      }))
    };
  }

  handleShoot(room, socketId, target) {
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex !== room.turnIndex || room.status !== 'playing') {
      return { error: 'Chưa đến lượt của bạn!' };
    }

    const shooter = room.players[playerIndex];
    const opponentIndex = (playerIndex + 1) % 2;
    const opponent = room.players[opponentIndex];

    const currentShell = room.shells[room.currentIndex];
    const isLive = currentShell === 'live';

    room.currentIndex++;

    let resultMsg = '';
    let resultType = '';

    // Handle Safety Lock
    if (room.lockActive) {
      room.lockActive = false;
      room.sawActive = false;
      room.contractActive = false;
      resultType = 'lock_safe';
      resultMsg = `🔒 Khóa nòng nổ lách cách! Viên đạn (${isLive ? 'THẬT' : 'GIẢ'}) được xả bỏ an toàn không mất HP.`;
      this.addLog(room, resultMsg);
      this.switchTurn(room);
    } else {
      const isContract = room.contractActive;
      room.contractActive = false;

      let damage = (room.sawActive ? 2 : 1) + (isContract && isLive ? 1 : 0);
      room.sawActive = false;

      let actualTargetPlayer = target === 'self' ? shooter : opponent;
      let isReflected = false;

      if (target === 'opponent' && opponent.mirrorActive) {
        opponent.mirrorActive = false;
        actualTargetPlayer = shooter;
        isReflected = true;
        this.addLog(room, `🪞 Gương Phản Xạ phát huy tác dụng! Phát bắn của ${shooter.nickname} bị BẬT NGƯỢC LẠI!`);
      }

      if (isLive) {
        actualTargetPlayer.hp = Math.max(0, actualTargetPlayer.hp - damage);
        resultType = target === 'self' ? 'self_live' : 'opponent_live';
        if (isReflected) {
          resultMsg = `💥 Phát bắn bị phản ngược! ${shooter.nickname} chịu ${damage} HP sát thương!`;
        } else {
          resultMsg = `💥 ${shooter.nickname} bắn ${actualTargetPlayer.nickname} bằng ĐẠN THẬT! Gây ${damage} HP sát thương!`;
        }
        this.addLog(room, resultMsg);
        this.switchTurn(room);
      } else {
        if (isContract) {
          shooter.hp = Math.max(0, shooter.hp - 1);
          this.addLog(room, `💥 Đạn GIẢ! Nhưng Hợp Đồng Đặt Cược phạt ${shooter.nickname} mất 1 HP!`);
        }

        if (target === 'self' && !isReflected) {
          resultType = 'self_blank';
          resultMsg = `💨 ${shooter.nickname} tự bắn mình bằng ĐẠN GIẢ! Được GIỮ LƯỢT!`;
          this.addLog(room, resultMsg);
        } else {
          resultType = 'opponent_blank';
          resultMsg = `💨 ${shooter.nickname} bắn bằng ĐẠN GIẢ! Không có sát thương.`;
          this.addLog(room, resultMsg);
          this.switchTurn(room);
        }
      }
    }

    room.lastAction = {
      type: 'shoot',
      actorSocketId: socketId,
      target,
      isLive,
      timestamp: Date.now()
    };

    if (shooter.hp <= 0 || opponent.hp <= 0) {
      room.status = 'ended';
      room.winner = shooter.hp > 0 ? shooter.socketId : opponent.socketId;
      const winnerName = shooter.hp > 0 ? shooter.nickname : opponent.nickname;
      this.addLog(room, `🏆 TRẬN ĐẤU KẾT THÚC! ${winnerName} CHIẾN THẮNG!`);
      return { success: true, resultType, resultMsg };
    }

    if (room.currentIndex >= room.shells.length) {
      this.addLog(room, '⚡ Đã hết đạn! Nạp băng đạn mới...');
      this.loadNewRound(room, false);
    }

    return { success: true, resultType, resultMsg };
  }

  handleUseItem(room, socketId, itemIndex, extraTarget = null) {
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex !== room.turnIndex || room.status !== 'playing') {
      return { error: 'Chưa đến lượt của bạn!' };
    }

    const player = room.players[playerIndex];
    const opponent = room.players[(playerIndex + 1) % 2];

    if (itemIndex < 0 || itemIndex >= player.items.length) {
      return { error: 'Vật phẩm không hợp lệ!' };
    }

    const itemKey = player.items[itemIndex];
    player.items.splice(itemIndex, 1);

    let privateFeedback = null;
    const currentShell = room.shells[room.currentIndex];

    switch (itemKey) {
      case ITEM_TYPES.GLASS: {
        privateFeedback = `🔍 Kính lúp cho thấy viên đạn hiện tại là: ${currentShell === 'live' ? 'ĐẠN THẬT (ĐỎ)' : 'ĐẠN GIẢ (XANH)'}`;
        this.addLog(room, `🔍 ${player.nickname} đã dùng Kính Lúp xem đạn.`);
        break;
      }

      case ITEM_TYPES.CIGARETTE: {
        if (player.hp < player.maxHp) {
          player.hp += 1;
          this.addLog(room, `🚬 ${player.nickname} hút thuốc hồi 1 HP! (${player.hp}/${player.maxHp})`);
        } else {
          this.addLog(room, `🚬 ${player.nickname} hút thuốc nhưng máu đã đầy!`);
        }
        break;
      }

      case ITEM_TYPES.BEER: {
        room.currentIndex++;
        this.addLog(room, `🍺 ${player.nickname} uống bia xả đạn: ${currentShell === 'live' ? 'ĐẠN THẬT (ĐỎ)' : 'ĐẠN GIẢ (XANH)'}`);
        if (room.currentIndex >= room.shells.length) {
          this.addLog(room, '⚡ Đã hết đạn! Nạp băng đạn mới...');
          this.loadNewRound(room, false);
        }
        break;
      }

      case ITEM_TYPES.SAW: {
        room.sawActive = true;
        this.addLog(room, `🪚 ${player.nickname} cưa nòng súng! Sát thương x2!`);
        break;
      }

      case ITEM_TYPES.HANDCUFFS: {
        opponent.handcuffed = true;
        this.addLog(room, `⛓️ ${player.nickname} còng tay ${opponent.nickname}! Mất lượt tiếp.`);
        break;
      }

      case ITEM_TYPES.INVERTER: {
        room.shells[room.currentIndex] = currentShell === 'live' ? 'blank' : 'live';
        this.addLog(room, `🔄 ${player.nickname} dùng Đầu Chuyển đổi loại đạn!`);
        break;
      }

      case ITEM_TYPES.PHONE: {
        const remaining = room.shells.length - room.currentIndex;
        if (remaining <= 1) {
          privateFeedback = `📞 Điện thoại: Không còn đạn tương lai để kiểm tra.`;
          this.addLog(room, `📞 ${player.nickname} dùng Điện thoại nhưng không có thêm thông tin.`);
        } else {
          const offset = Math.floor(Math.random() * (remaining - 1)) + 1;
          const futureIndex = room.currentIndex + offset;
          const futureShell = room.shells[futureIndex];
          privateFeedback = `📞 Điện thoại: Viên đạn thứ ${offset + 1} tính từ hiện tại là ${futureShell === 'live' ? 'ĐẠN THẬT (ĐỎ)' : 'ĐẠN GIẢ (XANH)'}`;
          this.addLog(room, `📞 ${player.nickname} nghe điện thoại nhận manh mối bí mật.`);
        }
        break;
      }

      case ITEM_TYPES.ADRENALINE: {
        const stealableItems = opponent.items
          .map((item, originalIndex) => ({ item, originalIndex }))
          .filter(i => i.item !== ITEM_TYPES.ADRENALINE);

        if (stealableItems.length === 0) {
          this.addLog(room, `💉 ${player.nickname} dùng Adrenaline nhưng đối thủ không có vật phẩm nào có thể cướp!`);
        } else {
          let chosenTarget = stealableItems[0];
          if (extraTarget !== null) {
            const found = stealableItems.find(i => i.originalIndex === extraTarget);
            if (found) chosenTarget = found;
          }
          const stolenItem = opponent.items.splice(chosenTarget.originalIndex, 1)[0];
          player.items.push(stolenItem);
          this.addLog(room, `💉 ${player.nickname} cướp ${ITEMS_INFO[stolenItem]?.nameVi || stolenItem} của ${opponent.nickname}!`);
        }
        break;
      }

      case ITEM_TYPES.EXPIRED_MEDICINE: {
        const isHeal = Math.random() < 0.5;
        if (isHeal) {
          player.hp = Math.min(player.maxHp, player.hp + 2);
          this.addLog(room, `💊 ${player.nickname} dùng Thuốc Hết Hạn HỒI 2 HP! (${player.hp}/${player.maxHp})`);
        } else {
          player.hp = Math.max(0, player.hp - 1);
          this.addLog(room, `💊 ${player.nickname} dùng Thuốc Hết Hạn BỊ NGỘ ĐỘC mất 1 HP! (${player.hp}/${player.maxHp})`);
          if (player.hp <= 0) {
            room.status = 'ended';
            room.winner = opponent.socketId;
            this.addLog(room, `🏆 TRẬN ĐẤU KẾT THÚC! ${opponent.nickname} CHIẾN THẮNG!`);
          }
        }
        break;
      }

      case ITEM_TYPES.MIRROR: {
        player.mirrorActive = true;
        this.addLog(room, `🪞 ${player.nickname} đặt Gương Phản Xạ bảo vệ bản thân!`);
        break;
      }

      case ITEM_TYPES.CONTRACT: {
        room.contractActive = true;
        this.addLog(room, `📜 ${player.nickname} kích hoạt Hợp Đồng Đặt Cược! (+1 dame nếu Thật, phạt 1 HP nếu Giả)`);
        break;
      }

      case ITEM_TYPES.BLEACH: {
        if (opponent.items.length === 0) {
          this.addLog(room, `🧪 ${player.nickname} dùng Nước Axit nhưng đối thủ không có vật phẩm nào!`);
        } else {
          let chosenIndex = 0;
          if (extraTarget !== null && extraTarget >= 0 && extraTarget < opponent.items.length) {
            chosenIndex = extraTarget;
          }
          const destroyedItem = opponent.items.splice(chosenIndex, 1)[0];
          this.addLog(room, `🧪 ${player.nickname} dùng Nước Axit tiêu hủy ${ITEMS_INFO[destroyedItem]?.nameVi || destroyedItem} của ${opponent.nickname}!`);
        }
        break;
      }

      case ITEM_TYPES.MAGNET: {
        let liveCount = 0;
        let blankCount = 0;
        for (let i = room.currentIndex; i < room.shells.length; i++) {
          if (room.shells[i] === 'live') liveCount++;
          else blankCount++;
        }
        privateFeedback = `🧲 Nam Châm Đếm Đạn: Còn ${liveCount} ĐẠN THẬT (ĐỎ) và ${blankCount} ĐẠN GIẢ (XANH) trong súng!`;
        this.addLog(room, `🧲 ${player.nickname} dùng Nam Châm quét số lượng đạn trong súng.`);
        break;
      }

      case ITEM_TYPES.LOCK: {
        room.lockActive = true;
        this.addLog(room, `🔒 ${player.nickname} bật Khóa Nòng An Toàn! Phát bắn tiếp theo sẽ bị khóa an toàn.`);
        break;
      }

      case ITEM_TYPES.SWAP: {
        const remaining = room.shells.length - room.currentIndex;
        if (remaining <= 1) {
          privateFeedback = `🔀 Kìm Gắp Đạn: Không còn viên đạn nào khác trong nòng để hoán đổi.`;
          this.addLog(room, `🔀 ${player.nickname} dùng Kìm Gắp Đạn nhưng súng chỉ còn 1 viên.`);
        } else {
          let offset = 1;
          if (extraTarget !== null && typeof extraTarget === 'number' && extraTarget >= 1 && extraTarget < remaining) {
            offset = extraTarget;
          }
          const swapIndex = room.currentIndex + offset;
          [room.shells[room.currentIndex], room.shells[swapIndex]] = [room.shells[swapIndex], room.shells[room.currentIndex]];
          this.addLog(room, `🔀 ${player.nickname} dùng Kìm Gắp Đạn tráo đổi viên đạn hiện tại với viên thứ ${offset + 1}!`);
        }
        break;
      }

      default: break;
    }

    room.lastAction = {
      type: 'use_item',
      actorSocketId: socketId,
      itemKey,
      timestamp: Date.now()
    };

    return { success: true, privateFeedback };
  }

  restartGame(room) {
    this.startGame(room);
  }
}
