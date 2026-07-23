// items.js - Items list and metadata
export const ITEM_TYPES = {
  GLASS: 'glass',
  CIGARETTE: 'cigarette',
  BEER: 'beer',
  SAW: 'saw',
  HANDCUFFS: 'handcuffs',
  INVERTER: 'inverter',
  PHONE: 'phone',
  ADRENALINE: 'adrenaline',
  EXPIRED_MEDICINE: 'expired_medicine'
};

export const ITEMS_INFO = {
  glass: {
    id: 'glass',
    name: 'Magnifying Glass',
    nameVi: 'Kính Lúp',
    icon: '🔍',
    description: 'Kiểm tra loại đạn (Thật hoặc Giả) đang nạp trong nòng súng.'
  },
  cigarette: {
    id: 'cigarette',
    name: 'Cigarettes',
    nameVi: 'Thuốc Lá',
    icon: '🚬',
    description: 'Hồi lại 1 điểm HP (máu) cho bản thân.'
  },
  beer: {
    id: 'beer',
    name: 'Beer',
    nameVi: 'Bia',
    icon: '🍺',
    description: 'Uống bia để xả bỏ viên đạn hiện tại khỏi nòng súng.'
  },
  saw: {
    id: 'saw',
    name: 'Handsaw',
    nameVi: 'Cưa Nòng Súng',
    icon: '🪚',
    description: 'Cưa nòng súng. Phát bắn tiếp theo sẽ gây sát thương x2 (2 HP).'
  },
  handcuffs: {
    id: 'handcuffs',
    name: 'Handcuffs',
    nameVi: 'Còng Tay',
    icon: '⛓️',
    description: 'Còng tay đối thủ, khiến đối thủ bị mất lượt chơi tiếp theo.'
  },
  inverter: {
    id: 'inverter',
    name: 'Inverter',
    nameVi: 'Đầu Chuyển',
    icon: '🔄',
    description: 'Đảo ngược loại đạn hiện tại (Đạn Thật ↔ Đạn Giả).'
  },
  phone: {
    id: 'phone',
    name: 'Burner Phone',
    nameVi: 'Điện Thoại',
    icon: '📞',
    description: 'Nghe điện thoại nhận gợi ý bí mật về vị trí một viên đạn tương lai.'
  },
  adrenaline: {
    id: 'adrenaline',
    name: 'Adrenaline',
    nameVi: 'Adrenaline',
    icon: '💉',
    description: 'Cướp 1 vật phẩm từ khay đồ đối thủ và sử dụng ngay lập tức.'
  },
  expired_medicine: {
    id: 'expired_medicine',
    name: 'Expired Medicine',
    nameVi: 'Thuốc Hết Hạn',
    icon: '💊',
    description: '50% cơ hội hồi 2 HP, 50% cơ hội bị ngộ độc mất 1 HP.'
  }
};
