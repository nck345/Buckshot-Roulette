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

  createRoom(hostSocketId, nickname) {
    let code = this.generateRoomCode();
    while (this.rooms.has(code)) {
      code = this.generateRoomCode();
    }

    const room = {
      code,
      hostId: hostSocketId,
      players: [
        {
          socketId: hostSocketId,
          nickname: nickname || 'Player 1',
          hp: 4,
          maxHp: 4,
          items: [],
          handcuffed: false
        }
      ],
      turnIndex: 0,
      round: 1,
      shells: [],
      currentIndex: 0,
      liveCount: 0,
      blankCount: 0,
      sawActive: false,
      status: 'waiting', // waiting, playing, ended
      winner: null,
      logs: []
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
      handcuffed: false
    });

    // Start game
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
        room.players.splice(pIndex, 1);
        if (room.players.length === 0) {
          this.rooms.delete(code);
        } else {
          room.status = 'ended';
          room.winner = room.players[0].socketId;
          this.addLog(room, `${room.players[0].nickname} thắng do đối thủ ngắt kết nối!`);
        }
        return { code, room };
      }
    }
    return null;
  }

  startGame(room) {
    room.status = 'playing';
    room.round = 1;
    room.turnIndex = Math.floor(Math.random() * 2); // Random starter
    const maxHp = 4;
    room.players.forEach(p => {
      p.maxHp = maxHp;
      p.hp = maxHp;
      p.items = [];
      p.handcuffed = false;
    });

    this.addLog(room, `Trận đấu bắt đầu! ${room.players[room.turnIndex].nickname} đi trước.`);
    this.loadNewRound(room);
  }

  loadNewRound(room) {
    room.sawActive = false;
    room.currentIndex = 0;

    // Determine shell counts (2 to 8 total)
    const totalShells = Math.floor(Math.random() * 5) + 3; // 3 to 7 shells
    let live = Math.floor(Math.random() * (totalShells - 1)) + 1; // At least 1 live
    let blank = totalShells - live;
    if (blank === 0) {
      blank = 1;
      live--;
    }

    room.liveCount = live;
    room.blankCount = blank;

    // Create array of shells
    const array = [];
    for (let i = 0; i < live; i++) array.push('live');
    for (let i = 0; i < blank; i++) array.push('blank');

    // Fisher-Yates Shuffle
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    room.shells = array;

    // Distribute 2-3 items to each player if inventory not full (max 8)
    const itemsPerPlayer = Math.floor(Math.random() * 2) + 2;
    room.players.forEach(p => {
      for (let i = 0; i < itemsPerPlayer; i++) {
        if (p.items.length < 8) {
          const randomItem = ALL_ITEM_KEYS[Math.floor(Math.random() * ALL_ITEM_KEYS.length)];
          p.items.push(randomItem);
        }
      }
    });

    this.addLog(room, `🔄 Nạp đạn mới: ${live} viên THẬT (Đỏ) | ${blank} viên GIẢ (Xanh).`);
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
      // Turn stays with current player
    } else {
      room.turnIndex = nextTurnIndex;
    }
  }

  // Sanitized state for sending to specific socket
  getSanitizedState(room, forSocketId) {
    return {
      code: room.code,
      status: room.status,
      round: room.round,
      turnIndex: room.turnIndex,
      turnSocketId: room.players[room.turnIndex]?.socketId,
      isMyTurn: room.players[room.turnIndex]?.socketId === forSocketId,
      sawActive: room.sawActive,
      liveCount: room.liveCount,
      blankCount: room.blankCount,
      totalShellsRemaining: room.shells.length - room.currentIndex,
      currentIndex: room.currentIndex,
      winner: room.winner,
      logs: room.logs,
      players: room.players.map(p => ({
        socketId: p.socketId,
        nickname: p.nickname,
        hp: p.hp,
        maxHp: p.maxHp,
        handcuffed: p.handcuffed,
        itemsCount: p.items.length,
        items: p.socketId === forSocketId ? p.items : p.items.map(i => 'unknown') // Hide opponent items details or show open
      }))
    };
  }

  // Player action: shoot_self or shoot_opponent
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
    const damage = room.sawActive ? 2 : 1;

    room.currentIndex++;
    const wasSawActive = room.sawActive;
    room.sawActive = false;

    let resultMsg = '';
    let resultType = '';

    if (target === 'self') {
      if (isLive) {
        shooter.hp = Math.max(0, shooter.hp - damage);
        resultType = 'self_live';
        resultMsg = `💥 ${shooter.nickname} tự bắn chính mình với viên THẬT! Mất ${damage} HP.`;
        this.addLog(room, resultMsg);
        
        this.switchTurn(room);
      } else {
        resultType = 'self_blank';
        resultMsg = `💨 ${shooter.nickname} tự bắn chính mình với viên GIẢ! Được GIỮ LƯỢT!`;
        this.addLog(room, resultMsg);
        // Player retains turn when shooting self with blank!
      }
    } else if (target === 'opponent') {
      if (isLive) {
        opponent.hp = Math.max(0, opponent.hp - damage);
        resultType = 'opponent_live';
        resultMsg = `💥 ${shooter.nickname} bắn ${opponent.nickname} bằng viên THẬT! Gây ${damage} sát thương!`;
        this.addLog(room, resultMsg);
      } else {
        resultType = 'opponent_blank';
        resultMsg = `💨 ${shooter.nickname} bắn ${opponent.nickname} bằng viên GIẢ! Không có sát thương.`;
        this.addLog(room, resultMsg);
      }
      this.switchTurn(room);
    }

    // Check game over
    if (shooter.hp <= 0 || opponent.hp <= 0) {
      room.status = 'ended';
      room.winner = shooter.hp > 0 ? shooter.socketId : opponent.socketId;
      const winnerName = shooter.hp > 0 ? shooter.nickname : opponent.nickname;
      this.addLog(room, `🏆 TRẬN ĐẤU KẾT THÚC! ${winnerName} LÀ NGƯỜI CHIẾN THẮNG!`);
      return { success: true, resultType, resultMsg };
    }

    // Check if shells empty -> auto load new round
    if (room.currentIndex >= room.shells.length) {
      this.addLog(room, '⚡ Băng đạn đã hết! Đang nạp băng đạn mới...');
      this.loadNewRound(room);
    }

    return { success: true, resultType, resultMsg };
  }

  // Player action: use item
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
    player.items.splice(itemIndex, 1); // remove item

    let privateFeedback = null;
    const currentShell = room.shells[room.currentIndex];

    switch (itemKey) {
      case ITEM_TYPES.GLASS: {
        privateFeedback = `🔍 Kính lúp cho thấy viên đạn hiện tại là: ${currentShell === 'live' ? 'ĐẠN THẬT (ĐỎ)' : 'ĐẠN GIẢ (XANH)'}`;
        this.addLog(room, `🔍 ${player.nickname} đã dùng Kính Lúp để kiểm tra viên đạn hiện tại.`);
        break;
      }

      case ITEM_TYPES.CIGARETTE: {
        if (player.hp < player.maxHp) {
          player.hp += 1;
          this.addLog(room, `🚬 ${player.nickname} hút thuốc và hồi 1 HP! (HP: ${player.hp}/${player.maxHp})`);
        } else {
          this.addLog(room, `🚬 ${player.nickname} hút thuốc nhưng máu đã đầy!`);
        }
        break;
      }

      case ITEM_TYPES.BEER: {
        room.currentIndex++;
        this.addLog(room, `🍺 ${player.nickname} uống bia và xả bỏ viên đạn hiện tại! Đạn bị xả ra là: ${currentShell === 'live' ? 'ĐẠN THẬT (ĐỎ)' : 'ĐẠN GIẢ (XANH)'}`);
        if (room.currentIndex >= room.shells.length) {
          this.addLog(room, '⚡ Băng đạn đã hết! Đang nạp băng đạn mới...');
          this.loadNewRound(room);
        }
        break;
      }

      case ITEM_TYPES.SAW: {
        if (room.sawActive) {
          this.addLog(room, `🪚 Nòng súng đã được cưa từ trước!`);
        } else {
          room.sawActive = true;
          this.addLog(room, `🪚 ${player.nickname} đã cưa nòng súng! Phát bắn tiếp theo sẽ gây 2 DẠNG SÁT THƯƠNG!`);
        }
        break;
      }

      case ITEM_TYPES.HANDCUFFS: {
        if (opponent.handcuffed) {
          this.addLog(room, `⛓️ Đối thủ đã bị còng tay sẵn rồi!`);
        } else {
          opponent.handcuffed = true;
          this.addLog(room, `⛓️ ${player.nickname} đã CÒNG TAY ${opponent.nickname}! Đối thủ sẽ mất lượt tiếp theo.`);
        }
        break;
      }

      case ITEM_TYPES.INVERTER: {
        const newShell = currentShell === 'live' ? 'blank' : 'live';
        room.shells[room.currentIndex] = newShell;
        this.addLog(room, `🔄 ${player.nickname} dùng Đầu Chuyển để thay đổi trạng thái viên đạn hiện tại!`);
        break;
      }

      case ITEM_TYPES.PHONE: {
        const remaining = room.shells.length - room.currentIndex;
        if (remaining <= 1) {
          privateFeedback = `📞 Điện thoại báo: "Không còn viên đạn tương lai nào để kiểm tra."`;
          this.addLog(room, `📞 ${player.nickname} dùng Điện thoại nhưng không có thêm thông tin.`);
        } else {
          // Pick a random future index
          const offset = Math.floor(Math.random() * (remaining - 1)) + 1; // 1 to remaining-1
          const futureIndex = room.currentIndex + offset;
          const futureShell = room.shells[futureIndex];
          privateFeedback = `📞 Điện thoại báo: "Viên đạn thứ ${offset + 1} tính từ hiện tại là ${futureShell === 'live' ? 'ĐẠN THẬT (ĐỎ)' : 'ĐẠN GIẢ (XANH)'}."`;
          this.addLog(room, `📞 ${player.nickname} đã nghe điện thoại để lấy manh mối bí mật.`);
        }
        break;
      }

      case ITEM_TYPES.ADRENALINE: {
        if (opponent.items.length === 0) {
          this.addLog(room, `💉 ${player.nickname} dùng Adrenaline nhưng đối thủ không có vật phẩm nào!`);
        } else {
          let stealIndex = extraTarget !== null ? extraTarget : Math.floor(Math.random() * opponent.items.length);
          if (stealIndex < 0 || stealIndex >= opponent.items.length) stealIndex = 0;
          const stolenItem = opponent.items[stealIndex];
          opponent.items.splice(stealIndex, 1);
          player.items.push(stolenItem);
          this.addLog(room, `💉 ${player.nickname} dùng Adrenaline cướp vật phẩm ${ITEMS_INFO[stolenItem]?.nameVi || stolenItem} của ${opponent.nickname}!`);
        }
        break;
      }

      case ITEM_TYPES.EXPIRED_MEDICINE: {
        const isHeal = Math.random() < 0.5;
        if (isHeal) {
          player.hp = Math.min(player.maxHp, player.hp + 2);
          this.addLog(room, `💊 ${player.nickname} dùng Thuốc Hết Hạn và HỒI THÀNH CÔNG 2 HP! (HP: ${player.hp}/${player.maxHp})`);
        } else {
          player.hp = Math.max(0, player.hp - 1);
          this.addLog(room, `💊 ${player.nickname} dùng Thuốc Hết Hạn bị NGỘ ĐỘC và mất 1 HP! (HP: ${player.hp}/${player.maxHp})`);
          if (player.hp <= 0) {
            room.status = 'ended';
            room.winner = opponent.socketId;
            this.addLog(room, `🏆 TRẬN ĐẤU KẾT THÚC! ${opponent.nickname} WIN do đối thủ tử vong vì ngộ độc!`);
          }
        }
        break;
      }

      default:
        break;
    }

    return { success: true, privateFeedback };
  }

  restartGame(room) {
    this.startGame(room);
  }
}
