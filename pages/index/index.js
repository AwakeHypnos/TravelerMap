const app = getApp()
import { getCurrentLocation, formatDistance } from '../../utils/location.js'

Page({
  data: {
    userInfo: null,
    currentLocation: null,
    locationText: '定位中...',
    recentLocations: [],
    savedRoutes: [],
    quickActions: [
      { id: 'search', name: '搜索地点', icon: '🔍', path: '/pages/search/search' },
      { id: 'ai-assistant', name: 'AI 助手', icon: '🤖', path: '/pages/ai-assistant/ai-assistant' },
      { id: 'route', name: '规划路线', icon: '🗺️', path: '/pages/route/route' },
      { id: 'activities', name: '热门活动', icon: '🎉', path: '/pages/activities/activities' },
      { id: 'collaborate', name: '地图共创', icon: '👥', path: '/pages/collaborative/collaborative' }
    ]
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.loadRecentData()
  },

  async initPage() {
    try {
      const location = await getCurrentLocation()
      this.setData({
        currentLocation: location,
        locationText: '已定位到当前位置'
      })
    } catch (error) {
      console.error('获取位置失败:', error)
      this.setData({
        locationText: '定位失败，请检查权限设置'
      })
    }

    this.loadRecentData()
  },

  loadRecentData() {
    try {
      const recentLocations = wx.getStorageSync('recentLocations') || []
      const savedRoutes = wx.getStorageSync('savedRoutes') || []
      
      this.setData({
        recentLocations: recentLocations.slice(0, 5),
        savedRoutes: savedRoutes.slice(0, 3)
      })
    } catch (error) {
      console.error('加载历史数据失败:', error)
    }
  },

  onTapAction(e) {
    const { path } = e.currentTarget.dataset
    wx.navigateTo({
      url: path
    })
  },

  onTapLocation(e) {
    const location = e.currentTarget.dataset.location
    if (location) {
      wx.navigateTo({
        url: `/pages/map/map?latitude=${location.latitude}&longitude=${location.longitude}&name=${encodeURIComponent(location.name)}`
      })
    }
  },

  onTapRoute(e) {
    const route = e.currentTarget.dataset.route
    if (route) {
      wx.navigateTo({
        url: `/pages/route/route?routeId=${route.id}`
      })
    }
  },

  onSearchInput(e) {
    const value = e.detail.value
    if (value && value.length > 0) {
      wx.navigateTo({
        url: `/pages/search/search?keyword=${encodeURIComponent(value)}`
      })
    }
  },

  onClearHistory() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('recentLocations')
            this.setData({
              recentLocations: []
            })
            app.showToast('已清除历史记录')
          } catch (error) {
            console.error('清除历史失败:', error)
            app.showToast('清除失败')
          }
        }
      }
    })
  }
})
