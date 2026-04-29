const app = getApp()

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      altitude: true,
      success: (res) => {
        const location = {
          latitude: res.latitude,
          longitude: res.longitude,
          altitude: res.altitude,
          accuracy: res.accuracy,
          address: null
        }
        app.globalData.currentLocation = location
        resolve(location)
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        reject(err)
      }
    })
  })
}

export const chooseLocation = () => {
  return new Promise((resolve, reject) => {
    wx.chooseLocation({
      success: (res) => {
        const location = {
          latitude: res.latitude,
          longitude: res.longitude,
          name: res.name,
          address: res.address
        }
        resolve(location)
      },
      fail: (err) => {
        console.error('选择位置失败:', err)
        reject(err)
      }
    })
  })
}

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}米`
  }
  return `${distance.toFixed(1)}公里`
}

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}小时`
  }
  return `${hours}小时${mins}分钟`
}
