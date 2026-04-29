const app = getApp()
import { getCurrentLocation, chooseLocation, calculateDistance, formatDistance } from '../../utils/location.js'
import { searchNearby, getDrivingRoute, getTransitRoute } from '../../utils/api.js'

Page({
  data: {
    mapContext: null,
    latitude: 39.9042,
    longitude: 116.4074,
    scale: 14,
    markers: [],
    polyline: [],
    circles: [],
    currentLocation: null,
    selectedLocation: null,
    showLocationInfo: false,
    showPOIList: false,
    nearbyPOIs: [],
    routeInfo: null,
    navigationMode: 'driving',
    showNavigationPanel: false,
    searchKeyword: '',
    showSearchBar: false,
    searchResults: []
  },

  onLoad(options) {
    this.mapContext = wx.createMapContext('map')
    this.initMap(options)
  },

  async initMap(options) {
    app.showLoading('加载地图中...')
    
    try {
      const location = await getCurrentLocation()
      
      let latitude = location.latitude
      let longitude = location.longitude
      
      if (options.latitude && options.longitude) {
        latitude = parseFloat(options.latitude)
        longitude = parseFloat(options.longitude)
      }
      
      this.setData({
        latitude: latitude,
        longitude: longitude,
        currentLocation: location
      })
      
      this.addCurrentLocationMarker(location)
      
      if (options.name || options.address) {
        const marker = {
          id: 1,
          latitude: latitude,
          longitude: longitude,
          title: options.name || '目标位置',
          iconPath: '/images/icons/marker.png',
          width: 40,
          height: 40,
          callout: {
            content: options.name || '目标位置',
            display: 'ALWAYS',
            padding: 10,
            borderRadius: 5,
            bgColor: '#ffffff',
            color: '#333333'
          }
        }
        
        this.setData({
          markers: [...this.data.markers, marker],
          selectedLocation: {
            latitude: latitude,
            longitude: longitude,
            name: options.name,
            address: options.address
          },
          showLocationInfo: true
        })
      }
      
      app.hideLoading()
    } catch (error) {
      console.error('初始化地图失败:', error)
      app.hideLoading()
      app.showToast('地图加载失败')
    }
  },

  addCurrentLocationMarker(location) {
    const marker = {
      id: 0,
      latitude: location.latitude,
      longitude: location.longitude,
      title: '当前位置',
      iconPath: '/images/icons/current-location.png',
      width: 30,
      height: 30
    }
    
    this.setData({
      markers: [marker]
    })
  },

  onLocateTap() {
    if (this.data.currentLocation) {
      this.mapContext.moveToLocation({
        latitude: this.data.currentLocation.latitude,
        longitude: this.data.currentLocation.longitude,
        success: () => {
          this.setData({
            latitude: this.data.currentLocation.latitude,
            longitude: this.data.currentLocation.longitude
          })
        }
      })
    }
  },

  onMapTap(e) {
    const { latitude, longitude } = e.detail
    
    const marker = {
      id: Date.now(),
      latitude: latitude,
      longitude: longitude,
      title: '选择的位置',
      iconPath: '/images/icons/marker.png',
      width: 40,
      height: 40
    }
    
    this.setData({
      markers: [...this.data.markers.slice(0, 1), marker],
      selectedLocation: {
        latitude: latitude,
        longitude: longitude
      },
      showLocationInfo: true
    })
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId
    const marker = this.data.markers.find(m => m.id === markerId)
    
    if (marker) {
      this.setData({
        selectedLocation: {
          latitude: marker.latitude,
          longitude: marker.longitude,
          name: marker.title,
          address: marker.address
        },
        showLocationInfo: true
      })
    }
  },

  onChooseLocation() {
    chooseLocation()
      .then(location => {
        const marker = {
          id: Date.now(),
          latitude: location.latitude,
          longitude: location.longitude,
          title: location.name,
          address: location.address,
          iconPath: '/images/icons/marker.png',
          width: 40,
          height: 40
        }
        
        this.setData({
          markers: [...this.data.markers.slice(0, 1), marker],
          selectedLocation: location,
          showLocationInfo: true,
          latitude: location.latitude,
          longitude: location.longitude
        })
      })
      .catch(err => {
        console.error('选择位置失败:', err)
      })
  },

  onSearchTap() {
    this.setData({
      showSearchBar: true
    })
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  onSearchConfirm() {
    const { searchKeyword, currentLocation } = this.data
    if (!searchKeyword) return
    
    app.showLoading('搜索中...')
    
    searchNearby(currentLocation, searchKeyword, 5000)
      .then(results => {
        this.setData({
          searchResults: results,
          showSearchBar: false
        })
        
        if (results.length > 0) {
          const markers = this.data.markers.slice(0, 1)
          
          results.forEach((poi, index) => {
            markers.push({
              id: 100 + index,
              latitude: poi.latitude,
              longitude: poi.longitude,
              title: poi.name,
              address: poi.address,
              iconPath: '/images/icons/marker.png',
              width: 35,
              height: 35,
              label: {
                content: poi.name,
                color: '#333333',
                fontSize: 12,
                anchorX: 0,
                anchorY: -30,
                borderWidth: 1,
                borderRadius: 5,
                bgColor: '#ffffff',
                padding: 5
              }
            })
          })
          
          this.setData({
            markers: markers
          })
          
          this.includePoints(markers)
        }
        
        app.hideLoading()
      })
      .catch(err => {
        console.error('搜索失败:', err)
        app.hideLoading()
        app.showToast('搜索失败')
      })
  },

  onSearchCancel() {
    this.setData({
      showSearchBar: false,
      searchKeyword: '',
      searchResults: []
    })
  },

  includePoints(markers) {
    if (markers.length === 0) return
    
    const points = markers.map(m => ({
      latitude: m.latitude,
      longitude: m.longitude
    }))
    
    this.mapContext.includePoints({
      padding: [100, 50, 100, 50],
      points: points
    })
  },

  onShowNearby(e) {
    const { category } = e.currentTarget.dataset
    if (!this.data.currentLocation) {
      app.showToast('请先获取当前位置')
      return
    }
    
    app.showLoading('查找中...')
    
    searchNearby(this.data.currentLocation, category, 1000)
      .then(pois => {
        this.setData({
          nearbyPOIs: pois,
          showPOIList: true
        })
        
        const markers = this.data.markers.slice(0, 1)
        
        pois.forEach((poi, index) => {
          markers.push({
            id: 200 + index,
            latitude: poi.latitude,
            longitude: poi.longitude,
            title: poi.name,
            address: poi.address,
            iconPath: '/images/icons/poi.png',
            width: 30,
            height: 30
          })
        })
        
        this.setData({
          markers: markers
        })
        
        this.includePoints(markers)
        app.hideLoading()
      })
      .catch(err => {
        console.error('查找附近失败:', err)
        app.hideLoading()
        app.showToast('查找失败')
      })
  },

  onPOITap(e) {
    const poi = e.currentTarget.dataset.poi
    if (!poi) return
    
    const markers = this.data.markers.slice(0, 1)
    const poiMarker = {
      id: 300,
      latitude: poi.latitude,
      longitude: poi.longitude,
      title: poi.name,
      address: poi.address,
      iconPath: '/images/icons/marker-selected.png',
      width: 45,
      height: 45
    }
    markers.push(poiMarker)
    
    this.setData({
      markers: markers,
      selectedLocation: poi,
      showLocationInfo: true,
      latitude: poi.latitude,
      longitude: poi.longitude
    })
    
    this.mapContext.moveToLocation({
      latitude: poi.latitude,
      longitude: poi.longitude
    })
  },

  onClosePOIList() {
    this.setData({
      showPOIList: false,
      nearbyPOIs: [],
      markers: this.data.markers.slice(0, 1)
    })
  },

  onNavigate() {
    const { selectedLocation, currentLocation, navigationMode } = this.data
    
    if (!selectedLocation) {
      app.showToast('请先选择目的地')
      return
    }
    
    if (!currentLocation) {
      app.showToast('请先获取当前位置')
      return
    }
    
    app.showLoading('规划路线中...')
    
    const routePromise = navigationMode === 'transit' 
      ? getTransitRoute(currentLocation, selectedLocation)
      : getDrivingRoute(currentLocation, selectedLocation)
    
    routePromise
      .then(routeInfo => {
        this.setData({
          routeInfo: routeInfo,
          showNavigationPanel: true
        })
        
        if (routeInfo.polyline) {
          const polyline = [{
            points: routeInfo.polyline,
            color: '#3498db',
            width: 6,
            arrowLine: true,
            borderColor: '#ffffff',
            borderWidth: 2
          }]
          
          this.setData({
            polyline: polyline
          })
          
          const allPoints = [
            { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }
          ]
          this.mapContext.includePoints({
            padding: [100, 50, 100, 50],
            points: allPoints
          })
        }
        
        app.hideLoading()
      })
      .catch(err => {
        console.error('规划路线失败:', err)
        app.hideLoading()
        app.showToast('路线规划失败')
      })
  },

  onModeChange(e) {
    const { mode } = e.currentTarget.dataset
    this.setData({
      navigationMode: mode
    })
  },

  onStartNavigation() {
    const { selectedLocation, routeInfo } = this.data
    if (!selectedLocation) return
    
    wx.openLocation({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      name: selectedLocation.name || '目的地',
      address: selectedLocation.address || '',
      scale: 18
    })
  },

  onCloseNavigation() {
    this.setData({
      showNavigationPanel: false,
      routeInfo: null,
      polyline: []
    })
  },

  onAddToRoute() {
    const { selectedLocation } = this.data
    if (!selectedLocation) {
      app.showToast('请先选择地点')
      return
    }
    
    try {
      const savedLocations = wx.getStorageSync('selectedLocations') || []
      
      const exists = savedLocations.some(loc => 
        loc.latitude === selectedLocation.latitude && 
        loc.longitude === selectedLocation.longitude
      )
      
      if (exists) {
        app.showToast('该地点已添加')
        return
      }
      
      savedLocations.push({
        ...selectedLocation,
        id: Date.now(),
        addedAt: new Date().toISOString()
      })
      
      wx.setStorageSync('selectedLocations', savedLocations)
      app.showToast('已添加到路线规划')
    } catch (error) {
      console.error('添加地点失败:', error)
      app.showToast('添加失败')
    }
  },

  onCloseLocationInfo() {
    this.setData({
      showLocationInfo: false
    })
  }
})
