const app = getApp()

const SOCIAL_PLATFORMS = {
  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    baseUrl: 'https://api.xiaohongshu.example.com'
  },
  douyin: {
    name: '抖音',
    icon: '🎵',
    baseUrl: 'https://api.douyin.example.com'
  },
  weibo: {
    name: '微博',
    icon: '📱',
    baseUrl: 'https://api.weibo.example.com'
  }
}

export const searchHotActivities = (location, keywords = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const { platforms = ['xiaohongshu', 'douyin'], limit = 20 } = options
    
    const mockActivities = generateMockSocialActivities(location, keywords, platforms, limit)
    
    setTimeout(() => {
      resolve({
        success: true,
        total: mockActivities.length,
        platforms: platforms,
        activities: mockActivities,
        searchTime: new Date().toISOString()
      })
    }, 800)
  })
}

export const searchXiaohongshu = (location, keywords = [], limit = 10) => {
  return new Promise((resolve, reject) => {
    const mockPosts = generateMockXiaohongshuPosts(location, keywords, limit)
    
    setTimeout(() => {
      resolve({
        success: true,
        platform: 'xiaohongshu',
        posts: mockPosts,
        searchTime: new Date().toISOString()
      })
    }, 500)
  })
}

export const searchDouyin = (location, keywords = [], limit = 10) => {
  return new Promise((resolve, reject) => {
    const mockVideos = generateMockDouyinVideos(location, keywords, limit)
    
    setTimeout(() => {
      resolve({
        success: true,
        platform: 'douyin',
        videos: mockVideos,
        searchTime: new Date().toISOString()
      })
    }, 500)
  })
}

export const searchTrendingTopics = (location, category = 'all') => {
  return new Promise((resolve, reject) => {
    const mockTopics = generateMockTrendingTopics(location, category)
    
    setTimeout(() => {
      resolve({
        success: true,
        location: location?.name || '当前城市',
        category: category,
        topics: mockTopics,
        updateTime: new Date().toISOString()
      })
    }, 400)
  })
}

export const getActivityRecommendations = (location, userPreferences = {}) => {
  return new Promise((resolve, reject) => {
    const { interests = [], budget = 'medium', timeAvailable = 120 } = userPreferences
    
    const mockRecommendations = generateMockActivityRecommendations(location, interests, budget, timeAvailable)
    
    setTimeout(() => {
      resolve({
        success: true,
        location: location?.name || '当前位置',
        recommendations: mockRecommendations,
        generatedAt: new Date().toISOString()
      })
    }, 600)
  })
}

function generateMockSocialActivities(location, keywords, platforms, limit) {
  const activities = []
  const baseLat = location?.latitude || 39.9042
  const baseLon = location?.longitude || 116.4074
  
  const activityTemplates = [
    {
      title: '故宫赏银杏最佳时间',
      content: '每年10月底到11月初是故宫银杏最美的季节，推荐从午门进入，沿中轴线走到御花园，红墙配黄叶超有氛围感！',
      category: '景点',
      tags: ['故宫', '银杏', '拍照打卡'],
      popularity: 98,
      likes: 12580,
      comments: 892,
      shares: 2341
    },
    {
      title: '南锣鼓巷隐藏美食攻略',
      content: '别只吃主街的网红店，往胡同里走有惊喜！推荐文宇奶酪店的原味奶酪，还有方砖厂69号炸酱面，本地人都爱去。',
      category: '美食',
      tags: ['南锣鼓巷', '老北京美食', '胡同'],
      popularity: 95,
      likes: 8920,
      comments: 654,
      shares: 1890
    },
    {
      title: '景山公园绝美日落',
      content: '北京看日落的绝佳位置！登上万春亭可以俯瞰整个故宫和中南海，傍晚时分光线柔和，拍照超级出片。',
      category: '自然景观',
      tags: ['日落', '景山', '全景'],
      popularity: 92,
      likes: 7650,
      comments: 432,
      shares: 1560
    },
    {
      title: '798艺术区拍照指南',
      content: '798真的太好拍了！工业风建筑、涂鸦墙、艺术展览随便拍都好看。推荐周末下午去，光线最好。',
      category: '艺术',
      tags: ['798', '拍照', '艺术展览'],
      popularity: 88,
      likes: 6780,
      comments: 567,
      shares: 1230
    },
    {
      title: '三里屯太古里潮流打卡',
      content: '潮人聚集地！不仅可以逛街购物，还有很多网红咖啡店和餐厅。晚上的夜景也很美，适合拍照。',
      category: '购物娱乐',
      tags: ['三里屯', '购物', '网红店'],
      popularity: 85,
      likes: 5430,
      comments: 321,
      shares: 980
    },
    {
      title: '后海酒吧街夜生活',
      content: '晚上的后海超有氛围！可以沿着湖边散步，也可以找一家小酒吧听听歌。推荐夏天去，微风拂面很舒服。',
      category: '娱乐',
      tags: ['后海', '酒吧', '夜生活'],
      popularity: 82,
      likes: 4560,
      comments: 289,
      shares: 765
    },
    {
      title: '雍和宫祈福攻略',
      content: '北京最灵验的寺庙之一！建议早点去，避开人流高峰。可以请香祈福，门口的国子监街也很适合逛逛。',
      category: '文化',
      tags: ['雍和宫', '祈福', '寺庙'],
      popularity: 90,
      likes: 8900,
      comments: 756,
      shares: 2100
    },
    {
      title: '恭王府深度游',
      content: '一座恭王府，半部清代史！和珅的宅子真的太奢华了，推荐租个讲解器，了解背后的历史故事。',
      category: '历史文化',
      tags: ['恭王府', '历史', '园林'],
      popularity: 87,
      likes: 6230,
      comments: 445,
      shares: 1340
    }
  ]
  
  const platformList = Object.keys(SOCIAL_PLATFORMS).filter(p => platforms.includes(p))
  
  for (let i = 0; i < Math.min(limit, activityTemplates.length * platformList.length); i++) {
    const template = activityTemplates[i % activityTemplates.length]
    const platform = platformList[Math.floor(i / activityTemplates.length) % platformList.length]
    
    activities.push({
      id: `activity_${Date.now()}_${i}`,
      platform: platform,
      platformName: SOCIAL_PLATFORMS[platform].name,
      platformIcon: SOCIAL_PLATFORMS[platform].icon,
      ...template,
      location: {
        name: template.title,
        address: '北京市朝阳区某某地址',
        latitude: baseLat + (Math.random() - 0.5) * 0.1,
        longitude: baseLon + (Math.random() - 0.5) * 0.1
      },
      author: {
        name: generateRandomAuthor(),
        avatar: null,
        followers: Math.floor(Math.random() * 100000 + 1000)
      },
      images: generateMockImages(),
      publishTime: generateRandomPublishTime(),
      distance: (Math.random() * 20).toFixed(1)
    })
  }
  
  return activities.sort((a, b) => b.popularity - a.popularity)
}

function generateMockXiaohongshuPosts(location, keywords, limit) {
  const posts = []
  const baseLat = location?.latitude || 39.9042
  const baseLon = location?.longitude || 116.4074
  
  const templates = [
    { title: '故宫拍照绝佳机位', content: '分享几个故宫人少又出片的拍照位置，再也不用拍人头了！', tags: ['故宫', '拍照', '北京旅游'] },
    { title: '北京5家必吃老字号', content: '来北京一定要吃的老字号，每一家都有几十年历史！', tags: ['北京美食', '老字号', '探店'] },
    { title: '胡同里的宝藏咖啡店', content: '藏在胡同里的小众咖啡店，环境超赞，适合发呆一下午。', tags: ['咖啡店', '胡同', '小众打卡'] },
    { title: '秋天的圆明园太美了', content: '圆明园的秋景真的绝了，大片的银杏和芦苇荡，拍照超有氛围感！', tags: ['圆明园', '秋天', '拍照'] }
  ]
  
  for (let i = 0; i < Math.min(limit, templates.length); i++) {
    const template = templates[i]
    posts.push({
      id: `xhs_${Date.now()}_${i}`,
      ...template,
      likes: Math.floor(Math.random() * 10000 + 1000),
      comments: Math.floor(Math.random() * 500 + 50),
      collects: Math.floor(Math.random() * 3000 + 200),
      author: {
        name: generateRandomAuthor(),
        avatar: null
      },
      images: generateMockImages(),
      location: {
        name: template.title.split(' ')[0],
        latitude: baseLat + (Math.random() - 0.5) * 0.05,
        longitude: baseLon + (Math.random() - 0.5) * 0.05
      },
      publishTime: generateRandomPublishTime()
    })
  }
  
  return posts
}

function generateMockDouyinVideos(location, keywords, limit) {
  const videos = []
  const baseLat = location?.latitude || 39.9042
  const baseLon = location?.longitude || 116.4074
  
  const templates = [
    { title: '北京必去的10个景点', duration: 60, music: '热门BGM' },
    { title: '挑战100元吃遍北京小吃', duration: 120, music: '美食博主专属' },
    { title: '沉浸式逛故宫', duration: 180, music: '古风音乐' },
    { title: '北京夜景航拍', duration: 90, music: '震撼背景音乐' }
  ]
  
  for (let i = 0; i < Math.min(limit, templates.length); i++) {
    const template = templates[i]
    videos.push({
      id: `dy_${Date.now()}_${i}`,
      ...template,
      likes: Math.floor(Math.random() * 50000 + 5000),
      comments: Math.floor(Math.random() * 2000 + 200),
      shares: Math.floor(Math.random() * 5000 + 500),
      author: {
        name: generateRandomAuthor(),
        avatar: null,
        verified: Math.random() > 0.5
      },
      coverImage: null,
      location: {
        name: template.title.substring(0, 4),
        latitude: baseLat + (Math.random() - 0.5) * 0.05,
        longitude: baseLon + (Math.random() - 0.5) * 0.05
      },
      publishTime: generateRandomPublishTime()
    })
  }
  
  return videos
}

function generateMockTrendingTopics(location, category) {
  const topics = [
    { rank: 1, title: '#故宫赏银杏#', heat: 2580000, category: '景点', trend: 'up' },
    { rank: 2, title: '#北京秋日限定#', heat: 1890000, category: '生活', trend: 'up' },
    { rank: 3, title: '#老北京美食探店#', heat: 1560000, category: '美食', trend: 'stable' },
    { rank: 4, title: '#胡同里的咖啡店#', heat: 1230000, category: '生活', trend: 'up' },
    { rank: 5, title: '#周末去哪儿玩#', heat: 980000, category: '娱乐', trend: 'down' },
    { rank: 6, title: '#北京夜景打卡#', heat: 850000, category: '景点', trend: 'up' },
    { rank: 7, title: '#798艺术展#', heat: 720000, category: '艺术', trend: 'stable' },
    { rank: 8, title: '#三里屯探店#', heat: 650000, category: '购物', trend: 'down' },
    { rank: 9, title: '#雍和宫祈福#', heat: 580000, category: '文化', trend: 'up' },
    { rank: 10, title: '#后海酒吧街#', heat: 450000, category: '娱乐', trend: 'stable' }
  ]
  
  if (category !== 'all') {
    return topics.filter(t => t.category === category || category === 'all')
  }
  
  return topics
}

function generateMockActivityRecommendations(location, interests, budget, timeAvailable) {
  const budgetMap = {
    low: { maxPrice: 50, label: '经济实惠' },
    medium: { maxPrice: 150, label: '中等预算' },
    high: { maxPrice: 500, label: '高品质体验' }
  }
  
  const budgetInfo = budgetMap[budget] || budgetMap.medium
  
  const recommendations = [
    {
      id: 'rec_1',
      type: 'attraction',
      title: '故宫博物院深度游',
      description: '推荐理由：世界上现存规模最大、保存最完整的木质结构古建筑之一。建议预留3-4小时深度游览。',
      estimatedTime: 180,
      price: 60,
      distance: '2.5公里',
      popularity: 98,
      matchingTags: interests.includes('历史') || interests.includes('文化') ? 95 : 70,
      tips: ['建议早上开门就去，避开人流高峰', '租个讲解器，了解背后的历史故事', '中轴线 + 珍宝馆 + 钟表馆必看']
    },
    {
      id: 'rec_2',
      type: 'food',
      title: '老北京炸酱面体验',
      description: '推荐理由：北京特色美食，面条劲道，酱料浓郁，配上黄瓜丝、豆芽等配菜，地道北京味。',
      estimatedTime: 45,
      price: 35,
      distance: '1.2公里',
      popularity: 85,
      matchingTags: interests.includes('美食') ? 90 : 60,
      tips: ['推荐方砖厂69号炸酱面', '可以加个卤蛋或炸丸子', '配上腊八蒜更地道']
    },
    {
      id: 'rec_3',
      type: 'activity',
      title: '南锣鼓巷胡同游',
      description: '推荐理由：北京最古老的街区之一，保存着元大都时期的胡同风貌，有很多特色小店和咖啡馆。',
      estimatedTime: 90,
      price: 0,
      distance: '3公里',
      popularity: 90,
      matchingTags: interests.includes('文化') || interests.includes('购物') ? 85 : 70,
      tips: ['主街人多，可以往支胡同里走', '文宇奶酪店值得一尝', '傍晚去拍照光线最好']
    },
    {
      id: 'rec_4',
      type: 'entertainment',
      title: '三里屯太古里逛街',
      description: '推荐理由：北京最时尚的商业区，汇集了众多国际品牌、潮牌店、网红餐厅和咖啡馆。',
      estimatedTime: 120,
      price: 200,
      distance: '4公里',
      popularity: 88,
      matchingTags: interests.includes('购物') || interests.includes('美食') ? 90 : 65,
      tips: ['晚上夜景很美，适合拍照', '北区高端品牌，南区更年轻化', 'PAGE ONE书店值得一逛']
    }
  ]
  
  return recommendations
    .filter(rec => rec.price <= budgetInfo.maxPrice)
    .filter(rec => rec.estimatedTime <= timeAvailable)
    .sort((a, b) => b.matchingTags - a.matchingTags)
}

function generateRandomAuthor() {
  const names = ['旅行达人小王', '美食探店家', '拍照小能手', '城市漫步者', '咖啡爱好者', '文艺青年', '户外探险家', '时尚博主']
  return names[Math.floor(Math.random() * names.length)]
}

function generateMockImages() {
  return null
}

function generateRandomPublishTime() {
  const now = Date.now()
  const hoursAgo = Math.floor(Math.random() * 72)
  return new Date(now - hoursAgo * 3600000).toISOString()
}

export const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

export const formatTimeAgo = (isoString) => {
  const now = new Date()
  const past = new Date(isoString)
  const diffMs = now - past
  
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return past.toLocaleDateString('zh-CN')
  }
}
