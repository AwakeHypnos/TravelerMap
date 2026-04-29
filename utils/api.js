const app = getApp()

const API_BASE_URL = 'https://api.example.com'

export const request = (options) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      url: API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err)
        reject(err)
      }
    }
    
    wx.request(defaultOptions)
  })
}

export const searchPlaces = (keyword, location, radius = 5000) => {
  return new Promise((resolve, reject) => {
    if (!app.globalData.apiKey.map) {
      reject(new Error('地图API密钥未配置'))
      return
    }
    
    const mockPlaces = generateMockPlaces(keyword, location)
    setTimeout(() => {
      resolve(mockPlaces)
    }, 500)
  })
}

export const searchNearby = (location, category, radius = 1000) => {
  return new Promise((resolve, reject) => {
    if (!location) {
      reject(new Error('位置信息不能为空'))
      return
    }
    
    const mockPOIs = generateMockPOIs(location, category)
    setTimeout(() => {
      resolve(mockPOIs)
    }, 300)
  })
}

export const getDrivingRoute = (origin, destination, waypoints = []) => {
  return new Promise((resolve, reject) => {
    if (!origin || !destination) {
      reject(new Error('起点和终点不能为空'))
      return
    }
    
    const mockRoute = {
      distance: Math.random() * 20 + 5,
      duration: Math.floor(Math.random() * 60 + 15),
      polyline: generateMockPolyline(origin, destination),
      steps: generateMockSteps(origin, destination)
    }
    
    setTimeout(() => {
      resolve(mockRoute)
    }, 400)
  })
}

export const getTransitRoute = (origin, destination) => {
  return new Promise((resolve, reject) => {
    if (!origin || !destination) {
      reject(new Error('起点和终点不能为空'))
      return
    }
    
    const mockTransit = {
      distance: Math.random() * 15 + 3,
      duration: Math.floor(Math.random() * 90 + 20),
      routes: [
        {
          type: 'metro',
          distance: Math.random() * 10 + 2,
          duration: Math.floor(Math.random() * 40 + 10),
          price: Math.floor(Math.random() * 5 + 2),
          lineName: '地铁1号线'
        },
        {
          type: 'bus',
          distance: Math.random() * 12 + 3,
          duration: Math.floor(Math.random() * 60 + 15),
          price: 2,
          lineName: '88路公交'
        }
      ]
    }
    
    setTimeout(() => {
      resolve(mockTransit)
    }, 400)
  })
}

export const getActivities = (location, tags = [], page = 1, pageSize = 20) => {
  return new Promise((resolve, reject) => {
    const mockActivities = generateMockActivities(location, tags, page, pageSize)
    setTimeout(() => {
      resolve(mockActivities)
    }, 300)
  })
}

export const createCollaborativeRoom = (roomName) => {
  return new Promise((resolve, reject) => {
    const roomId = generateRoomId()
    const room = {
      id: roomId,
      name: roomName,
      createdAt: new Date().toISOString(),
      maxMembers: 4,
      members: [],
      mapData: {
        markers: [],
        routes: [],
        votes: {}
      }
    }
    
    setTimeout(() => {
      resolve(room)
    }, 200)
  })
}

export const joinCollaborativeRoom = (roomId, userInfo) => {
  return new Promise((resolve, reject) => {
    if (!roomId || !userInfo) {
      reject(new Error('房间ID或用户信息不能为空'))
      return
    }
    
    setTimeout(() => {
      resolve({
        success: true,
        roomId: roomId,
        joinTime: new Date().toISOString()
      })
    }, 200)
  })
}

function generateMockPlaces(keyword, location) {
  const places = []
  const baseLat = location?.latitude || 39.9042
  const baseLon = location?.longitude || 116.4074
  
  for (let i = 0; i < 10; i++) {
    places.push({
      id: `place_${Date.now()}_${i}`,
      name: `${keyword}地点${i + 1}`,
      address: `北京市朝阳区某某街道${i + 1}号`,
      latitude: baseLat + (Math.random() - 0.5) * 0.02,
      longitude: baseLon + (Math.random() - 0.5) * 0.02,
      distance: Math.random() * 5,
      category: keyword
    })
  }
  
  return places
}

function generateMockPOIs(location, category) {
  const pois = []
  const baseLat = location?.latitude || 39.9042
  const baseLon = location?.longitude || 116.4074
  
  const categoryMap = {
    subway: '地铁站',
    mall: '商场',
    restaurant: '餐厅',
    park: '公园',
    hotel: '酒店',
    convenience: '便利店'
  }
  
  const categoryName = categoryMap[category] || category
  
  for (let i = 0; i < 8; i++) {
    pois.push({
      id: `poi_${Date.now()}_${i}`,
      name: `${categoryName}${i + 1}`,
      address: `附近${categoryName}地址${i + 1}`,
      latitude: baseLat + (Math.random() - 0.5) * 0.01,
      longitude: baseLon + (Math.random() - 0.5) * 0.01,
      distance: Math.random() * 1,
      category: category
    })
  }
  
  return pois
}

function generateMockPolyline(origin, destination) {
  const points = []
  const steps = 10
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps
    points.push({
      latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio,
      longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio
    })
  }
  
  return points
}

function generateMockSteps(origin, destination) {
  return [
    {
      instruction: '从起点出发，向北行驶',
      distance: 0.5,
      duration: 2,
      direction: 'north'
    },
    {
      instruction: '在第一个路口右转',
      distance: 1.2,
      duration: 5,
      direction: 'east'
    },
    {
      instruction: '直行',
      distance: 2.0,
      duration: 8,
      direction: 'east'
    },
    {
      instruction: '到达目的地',
      distance: 0,
      duration: 0,
      direction: null
    }
  ]
}

function generateMockActivities(location, tags, page, pageSize) {
  const activities = []
  const baseLat = location?.latitude || 39.9042
  const baseLon = location?.longitude || 116.4074
  
  const activityTemplates = [
    { title: '现代艺术展览', tags: ['艺术', '文化'], price: 50 },
    { title: '音乐节', tags: ['娱乐', '热门'], price: 180 },
    { title: '美食节', tags: ['美食', '热门'], price: 0 },
    { title: '历史博物馆参观', tags: ['文化', '人文'], price: 30 },
    { title: '自然公园徒步', tags: ['自然景观', '户外'], price: 0 },
    { title: '城市灯光秀', tags: ['娱乐', '热门'], price: 0 },
    { title: '手工艺市集', tags: ['艺术', '人文'], price: 0 },
    { title: '古典音乐会', tags: ['艺术', '文化'], price: 120 }
  ]
  
  const count = Math.min(pageSize, activityTemplates.length)
  
  for (let i = 0; i < count; i++) {
    const template = activityTemplates[i]
    const matchingTags = tags.length === 0 || 
      template.tags.some(tag => tags.includes(tag))
    
    if (matchingTags) {
      activities.push({
        id: `activity_${Date.now()}_${i}`,
        title: template.title,
        description: `这是一个精彩的${template.tags[0]}活动，不容错过！`,
        tags: template.tags,
        price: template.price,
        startDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: {
          name: `${template.tags[0]}场馆`,
          address: '北京市朝阳区某某场馆地址',
          latitude: baseLat + (Math.random() - 0.5) * 0.05,
          longitude: baseLon + (Math.random() - 0.5) * 0.05
        },
        imageUrl: null
      })
    }
  }
  
  return {
    list: activities,
    total: activities.length,
    page: page,
    pageSize: pageSize
  }
}

function generateRoomId() {
  return 'ROOM_' + Math.random().toString(36).substring(2, 8).toUpperCase()
}
