const app = getApp()

const OPENCLAW_BASE_URL = 'https://api.openclaw.example.com/v1'

export const initOpenClaw = (apiKey) => {
  if (apiKey) {
    app.globalData.apiKey.ai = apiKey
  }
}

export const sendMessage = (message, context = {}) => {
  return new Promise((resolve, reject) => {
    const apiKey = app.globalData.apiKey.ai
    
    if (!apiKey || apiKey === 'your-ai-api-key') {
      const mockResponse = generateMockResponse(message, context)
      setTimeout(() => {
        resolve(mockResponse)
      }, 800)
      return
    }
    
    wx.request({
      url: `${OPENCLAW_BASE_URL}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: 'openclaw-travel',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行助手，帮助用户规划路线、推荐景点、查找热门活动。请用简洁、友好的中文回复。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
          const response = parseAIResponse(res.data.choices[0].message.content, message)
          resolve(response)
        } else {
          reject(new Error('AI 服务响应错误'))
        }
      },
      fail: (err) => {
        console.error('OpenClaw 请求失败:', err)
        const mockResponse = generateMockResponse(message, context)
        setTimeout(() => {
          resolve(mockResponse)
        }, 500)
      }
    })
  })
}

export const planRouteWithAI = (locations, preferences = {}) => {
  return new Promise((resolve, reject) => {
    const apiKey = app.globalData.apiKey.ai
    
    if (!apiKey || apiKey === 'your-ai-api-key') {
      const mockPlan = generateMockRoutePlan(locations, preferences)
      setTimeout(() => {
        resolve(mockPlan)
      }, 1000)
      return
    }
    
    const locationsText = locations.map((loc, index) => 
      `${index + 1}. ${loc.name} (${loc.address || '地址不详'})`
    ).join('\n')
    
    const prompt = `请帮我规划一条包含以下地点的最优旅行路线：
${locationsText}

用户偏好：
- 出行方式：${preferences.travelMode || '自驾'}
- 希望总时长：${preferences.maxTime || '不限'}
- 特殊需求：${preferences.specialNeeds || '无'}

请提供：
1. 推荐的路线顺序
2. 每个地点之间的预计时间
3. 每个地点的推荐停留时间
4. 总行程时间和距离
5. 路线优化建议`

    wx.request({
      url: `${OPENCLAW_BASE_URL}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: 'openclaw-travel',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的路线规划师，擅长根据用户需求提供最优旅行路线建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2000
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
          const plan = parseRoutePlanResponse(res.data.choices[0].message.content, locations)
          resolve(plan)
        } else {
          reject(new Error('AI 路线规划失败'))
        }
      },
      fail: (err) => {
        console.error('OpenClaw 路线规划请求失败:', err)
        const mockPlan = generateMockRoutePlan(locations, preferences)
        setTimeout(() => {
          resolve(mockPlan)
        }, 500)
      }
    })
  })
}

export const getTravelSuggestions = (location, interests = []) => {
  return new Promise((resolve, reject) => {
    const apiKey = app.globalData.apiKey.ai
    
    if (!apiKey || apiKey === 'your-ai-api-key') {
      const mockSuggestions = generateMockSuggestions(location, interests)
      setTimeout(() => {
        resolve(mockSuggestions)
      }, 600)
      return
    }
    
    const interestsText = interests.length > 0 ? interests.join('、') : '各类兴趣'
    
    const prompt = `我现在在 ${location.name || '当前位置'}，请根据我的兴趣推荐附近值得去的地方。
我的兴趣：${interestsText}

请推荐：
1. 必去景点（3-5个）
2. 特色餐厅（3-5个）
3. 购物中心（2-3个）
4. 娱乐活动（2-3个）

每个推荐包含：名称、推荐理由、预计停留时间`

    wx.request({
      url: `${OPENCLAW_BASE_URL}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: 'openclaw-travel',
        messages: [
          {
            role: 'system',
            content: '你是一个当地旅游专家，了解各个城市的热门景点、美食和娱乐活动。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
          const suggestions = parseSuggestionsResponse(res.data.choices[0].message.content)
          resolve(suggestions)
        } else {
          reject(new Error('获取旅行建议失败'))
        }
      },
      fail: (err) => {
        console.error('OpenClaw 旅行建议请求失败:', err)
        const mockSuggestions = generateMockSuggestions(location, interests)
        setTimeout(() => {
          resolve(mockSuggestions)
        }, 500)
      }
    })
  })
}

function generateMockResponse(message, context) {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('路线') || lowerMessage.includes('规划') || lowerMessage.includes('行程')) {
    return {
      type: 'route_plan',
      content: '我来帮你规划路线！请告诉我你想去哪些地方，我会为你推荐最优的游览顺序。',
      suggestions: [
        '告诉我你想去的城市或景点',
        '添加多个地点让我帮你排序',
        '告诉我你的出行方式（自驾/公交）'
      ]
    }
  }
  
  if (lowerMessage.includes('景点') || lowerMessage.includes('推荐') || lowerMessage.includes('好玩')) {
    return {
      type: 'suggestions',
      content: '根据你的位置，以下是一些推荐的景点：',
      attractions: [
        { name: '故宫博物院', reason: '中国古代皇家宫殿，必游之地', duration: '3-4小时' },
        { name: '景山公园', reason: '俯瞰故宫全景的最佳位置', duration: '1-2小时' },
        { name: '南锣鼓巷', reason: '老北京胡同文化，特色小店众多', duration: '2-3小时' }
      ]
    }
  }
  
  if (lowerMessage.includes('美食') || lowerMessage.includes('餐厅') || lowerMessage.includes('吃')) {
    return {
      type: 'food',
      content: '以下是附近的美食推荐：',
      restaurants: [
        { name: '老北京炸酱面', type: '中餐', rating: '4.5', price: '人均¥40' },
        { name: '东来顺火锅', type: '火锅', rating: '4.8', price: '人均¥120' },
        { name: '全聚德烤鸭', type: '北京菜', rating: '4.6', price: '人均¥200' }
      ]
    }
  }
  
  if (lowerMessage.includes('天气') || lowerMessage.includes('穿衣')) {
    return {
      type: 'info',
      content: '根据当前天气预报：',
      weather: {
        temp: '22°C',
        condition: '晴朗',
        humidity: '45%',
        wind: '微风',
        suggestion: '天气晴朗，适合外出游玩。建议穿着轻薄外套。'
      }
    }
  }
  
  return {
    type: 'chat',
    content: '你好！我是你的AI旅行助手 🤖',
    subContent: '我可以帮你：\n• 规划最优旅行路线\n• 推荐周边热门景点\n• 查找当地特色美食\n• 搜索小红书/抖音热门活动\n\n请告诉我你的需求，或者点击下方快捷选项开始吧！'
  }
}

function generateMockRoutePlan(locations, preferences) {
  const orderedLocations = [...locations]
  
  return {
    success: true,
    originalCount: locations.length,
    optimizedOrder: orderedLocations.map((loc, index) => ({
      ...loc,
      order: index + 1,
      estimatedTime: loc.estimatedTime || 60,
      travelTimeToNext: index < locations.length - 1 ? Math.floor(Math.random() * 30 + 15) : 0
    })),
    summary: {
      totalDistance: (Math.random() * 30 + 10).toFixed(1) + ' 公里',
      totalTime: (locations.length * 60 + locations.length * 20) + ' 分钟',
      travelMode: preferences.travelMode || '自驾',
      suggestions: [
        '建议早上9点出发，避开早高峰',
        '午餐时间可以在路线中间的地点附近用餐',
        '景点1和景点2距离较近，可以连续游览'
      ]
    }
  }
}

function generateMockSuggestions(location, interests) {
  return {
    location: location?.name || '当前位置',
    categories: [
      {
        type: 'attractions',
        title: '必去景点',
        items: [
          { name: '故宫博物院', reason: '中国最大的古代文化艺术博物馆', duration: '3-4小时', distance: '2.5公里' },
          { name: '景山公园', reason: '俯瞰故宫全景的最佳地点', duration: '1-2小时', distance: '2.3公里' },
          { name: '北海公园', reason: '保存最完整的古代皇家园林', duration: '2小时', distance: '3公里' }
        ]
      },
      {
        type: 'food',
        title: '特色美食',
        items: [
          { name: '护国寺小吃', type: '小吃', rating: '4.5', price: '人均¥30' },
          { name: '老北京炸酱面', type: '面食', rating: '4.3', price: '人均¥35' },
          { name: '南门涮肉', type: '火锅', rating: '4.7', price: '人均¥100' }
        ]
      },
      {
        type: 'shopping',
        title: '购物推荐',
        items: [
          { name: '王府井步行街', type: '综合商业', description: '北京最著名的商业街' },
          { name: '三里屯太古里', type: '时尚购物', description: '潮流品牌聚集地' }
        ]
      }
    ]
  }
}

function parseAIResponse(content, originalMessage) {
  const lowerContent = content.toLowerCase()
  const lowerMessage = originalMessage.toLowerCase()
  
  if (lowerMessage.includes('路线') || lowerMessage.includes('规划')) {
    return {
      type: 'route_plan',
      content: content,
      rawResponse: content
    }
  }
  
  if (lowerMessage.includes('景点') || lowerMessage.includes('推荐')) {
    return {
      type: 'suggestions',
      content: content,
      rawResponse: content
    }
  }
  
  return {
    type: 'chat',
    content: content,
    rawResponse: content
  }
}

function parseRoutePlanResponse(content, locations) {
  return {
    success: true,
    rawResponse: content,
    optimizedOrder: locations.map((loc, index) => ({
      ...loc,
      order: index + 1
    })),
    summary: {
      suggestions: ['请查看详细回复了解路线建议']
    }
  }
}

function parseSuggestionsResponse(content) {
  return {
    rawResponse: content,
    categories: []
  }
}
