// 根据性别获取颜色
function getColorByGender(gender) {
  switch(gender) {
    case '男':
    case 'male':
      return 'bg-blue-500';
    case '女': 
    case 'female':
      return 'bg-pink-500';
    default:
      return 'bg-gray-600';
  }
}

// 获取名字首字符作为头像
function getNameInitial(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// 创建头像元素
function createAvatar(name, gender = '', size = 'md') {
  const initial = getNameInitial(name);
  const color = getColorByGender(gender);
  
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };
  
  const sizeClass = sizes[size] || sizes.md;
  
  const avatar = document.createElement('div');
  avatar.className = `flex items-center justify-center rounded-full ${color} ${sizeClass} text-white font-medium`;
  avatar.textContent = initial;
  
  return avatar;
}

export { createAvatar };