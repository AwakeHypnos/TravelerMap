App({
  globalData: {
    userInfo: null,
    currentLocation: null,
    selectedLocations: [],
    currentRoute: null,
    collaborativeRoom: null,
    apiKey: {
      map: 'your-map-api-key',
      ai: 'your-ai-api-key'
    }
  },

  onLaunch() {
    this.checkLoginStatus()
    this.loadConfig()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  },

  loadConfig() {
    try {
      const config = wx.getStorageSync('config')
      if (config) {
        this.globalData.apiKey = {
          map: config.mapApiKey || this.globalData.apiKey.map,
          ai: config.aiApiKey || this.globalData.apiKey.ai
        }
      }
    } catch (e) {
      console.error('加载配置失败:', e)
    }
  },

  getUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.globalData.userInfo) {
        resolve(this.globalData.userInfo)
        return
      }
      
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.globalData.userInfo = res.userInfo
          resolve(res.userInfo)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  showToast(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title: title,
      icon: icon,
      duration: duration
    })
  },

  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    })
  },

  hideLoading() {
    wx.hideLoading()
  }
})
