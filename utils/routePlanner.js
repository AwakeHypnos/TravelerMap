import { calculateDistance } from './location.js'

const MAX_LOCATIONS = 20

export const generateShortestPath = (locations, startIndex = 0) => {
  if (!locations || locations.length < 2) {
    return locations
  }
  
  const n = locations.length
  const visited = new Array(n).fill(false)
  const path = []
  
  let current = startIndex
  visited[current] = true
  path.push(locations[current])
  
  for (let i = 1; i < n; i++) {
    let nearest = -1
    let minDistance = Infinity
    
    for (let j = 0; j < n; j++) {
      if (!visited[j]) {
        const dist = calculateDistance(
          locations[current].latitude,
          locations[current].longitude,
          locations[j].latitude,
          locations[j].longitude
        )
        if (dist < minDistance) {
          minDistance = dist
          nearest = j
        }
      }
    }
    
    if (nearest >= 0) {
      visited[nearest] = true
      path.push(locations[nearest])
      current = nearest
    }
  }
  
  return path
}

export const generateOptimalTour = (locations, startIndex = 0) => {
  if (!locations || locations.length < 3) {
    return locations
  }
  
  const n = locations.length
  const distanceMatrix = createDistanceMatrix(locations)
  const visited = new Set([startIndex])
  const path = [startIndex]
  let current = startIndex
  
  while (visited.size < n) {
    let nextCity = -1
    let minDistance = Infinity
    
    for (let i = 0; i < n; i++) {
      if (!visited.has(i)) {
        const dist = distanceMatrix[current][i]
        if (dist < minDistance) {
          minDistance = dist
          nextCity = i
        }
      }
    }
    
    if (nextCity >= 0) {
      visited.add(nextCity)
      path.push(nextCity)
      current = nextCity
    }
  }
  
  return path.map(index => locations[index])
}

export const createDistanceMatrix = (locations) => {
  const n = locations.length
  const matrix = new Array(n).fill(null).map(() => new Array(n).fill(0))
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        matrix[i][j] = calculateDistance(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude
        )
      }
    }
  }
  
  return matrix
}

export const calculateTotalDistance = (path) => {
  if (!path || path.length < 2) {
    return 0
  }
  
  let total = 0
  for (let i = 0; i < path.length - 1; i++) {
    total += calculateDistance(
      path[i].latitude,
      path[i].longitude,
      path[i + 1].latitude,
      path[i + 1].longitude
    )
  }
  return total
}

export const estimateTime = (distance, mode = 'driving') => {
  const speedMap = {
    driving: 40,
    walking: 5,
    cycling: 15,
    transit: 25
  }
  
  const speed = speedMap[mode] || 40
  const timeHours = distance / speed
  return Math.ceil(timeHours * 60)
}

export const planRouteWithTimeConstraints = (locations, timePlan, mode = 'driving') => {
  if (!timePlan || !timePlan.startTime) {
    return generateShortestPath(locations)
  }
  
  const plannedPath = []
  let currentTime = timePlan.startTime
  const timePerLocation = timePlan.timePerLocation || 60
  const maxTotalTime = timePlan.maxTotalTime || 480
  
  let currentLocations = [...locations]
  let currentIndex = 0
  
  while (currentLocations.length > 0) {
    if (currentIndex >= currentLocations.length) {
      currentIndex = 0
    }
    
    const loc = currentLocations[currentIndex]
    const estimatedTime = loc.estimatedTime || timePerLocation
    
    const previousLocation = plannedPath.length > 0 
      ? plannedPath[plannedPath.length - 1] 
      : null
    
    let travelTime = 0
    if (previousLocation) {
      const dist = calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        loc.latitude,
        loc.longitude
      )
      travelTime = estimateTime(dist, mode)
    }
    
    const totalRequiredTime = travelTime + estimatedTime
    
    if (currentTime + totalRequiredTime <= timePlan.startTime + maxTotalTime) {
      loc.arrivalTime = currentTime + travelTime
      loc.departureTime = currentTime + totalRequiredTime
      plannedPath.push(loc)
      currentLocations.splice(currentIndex, 1)
      currentTime = loc.departureTime
    } else {
      currentIndex++
    }
    
    if (currentIndex > currentLocations.length * 2) {
      break
    }
  }
  
  return plannedPath
}

export const validateLocations = (locations) => {
  if (!locations || locations.length === 0) {
    return { valid: false, message: '请至少添加一个地点' }
  }
  
  if (locations.length > MAX_LOCATIONS) {
    return { valid: false, message: `最多支持${MAX_LOCATIONS}个地点` }
  }
  
  for (const loc of locations) {
    if (!loc.latitude || !loc.longitude) {
      return { valid: false, message: '地点信息不完整' }
    }
  }
  
  return { valid: true, message: '地点验证通过' }
}
