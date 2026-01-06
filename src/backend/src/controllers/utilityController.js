/**
 * Utility Controller
 * Provides utility endpoints like server time
 */

/**
 * Get current server time in IST (Indian Standard Time)
 * @route GET /utility/server-time 
 */
const getServerTime = async (req, res) => {
  try {
    // Get current UTC time
    const now = new Date();
    
    // Convert to IST (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    
    // Extract IST time components
    const hours = istTime.getUTCHours(); // Use UTC methods since we already added offset
    const minutes = istTime.getUTCMinutes();
    const seconds = istTime.getUTCSeconds();
    const day = istTime.getUTCDate();
    const month = istTime.getUTCMonth() + 1; // Months are 0-indexed
    const year = istTime.getUTCFullYear();
    
    // Format time in 24-hour format (HH:MM:SS)
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Format date (DD/MM/YYYY)
    const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    
    res.status(200).json({
      success: true,
      data: {
        timestamp: istTime.getTime(), // Unix timestamp in milliseconds (IST)
        iso: istTime.toISOString(), // ISO format
        hour: hours, // 24-hour format (0-23)
        minute: minutes,
        second: seconds,
        date: formattedDate, // DD/MM/YYYY
        time: formattedTime, // HH:MM:SS (24-hour format)
        timezone: 'IST', // Indian Standard Time
        utcOffset: '+05:30', // UTC offset
      },
    });
  } catch (error) {
    console.error('Error fetching server time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch server time',
      message: error.message,
    });
  }
};

module.exports = {
  getServerTime,
};