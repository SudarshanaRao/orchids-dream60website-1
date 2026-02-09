const User = require('../models/user');
const Admin = require('../models/Admin');
const AuctionHistory = require('../models/AuctionHistory');
const HourlyAuction = require('../models/HourlyAuction');
const { sendSms, sendBulkSms, getBalance, getDeliveryReports, SMS_TEMPLATES, formatTemplate } = require('../utils/smsService');
const smsRestService = require('../utils/smsRestService');

const verifyAdmin = async (userId) => {
  if (!userId) return null;
  const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
  if (!adminUser) return null;
  return adminUser;
};

/**
 * REST API Methods for SMSCountry
 */

const getRestTemplates = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const result = await smsRestService.getTemplates();
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Get REST Templates Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createRestTemplate = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { templateName, message } = req.body;
    const result = await smsRestService.createTemplate(templateName, message);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Create REST Template Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteRestTemplate = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { templateId } = req.params;
    const result = await smsRestService.deleteTemplate(templateId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Delete REST Template Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSenderIds = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const result = await smsRestService.getSenderIds();
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Get Sender IDs Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSmsReports = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { fromDate, toDate, page, limit } = req.query;
    const offset = page ? (parseInt(page) - 1) * (parseInt(limit) || 10) + 1 : undefined;
    
    const result = await smsRestService.getDetailedReports({ 
      FromDate: fromDate, 
      ToDate: toDate, 
      Offset: offset, 
      Limit: limit 
    });
    
    if (!result.success) {
      console.error('SMS Reports API Failure:', result.error);
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get SMS Reports Controller Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch SMS reports', 
      error: error.message 
    });
  }
};

const getSmsStatus = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { messageId } = req.params;
    const result = await smsRestService.getSmsReport(messageId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Get SMS Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSmsTemplates = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const templates = Object.entries(SMS_TEMPLATES).map(([key, value]) => ({
      key,
      ...value,
    }));

    return res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error('Get SMS Templates Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSmsBalance = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const result = await getBalance();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get SMS Balance Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUsersForSms = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const {
      filter = 'all',
      auctionId,
      search,
      page = 1,
      limit = 50,
      minAuctions,
      maxAuctions,
      minWins,
      maxWins,
      hasPlayed,
      round,
      status,
    } = req.query;

    let query = { isDeleted: false, userType: 'USER' };
    let users = [];

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { userCode: { $regex: search, $options: 'i' } },
      ];
    }

    switch (filter) {
      case 'all':
        users = await User.find(query)
          .select('user_id username email mobile userCode totalAuctions totalWins')
          .sort({ createdAt: -1 })
          .skip((parseInt(page) - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean();
        break;

      case 'active_players':
        query.totalAuctions = { $gt: 0 };
        users = await User.find(query)
          .select('user_id username email mobile userCode totalAuctions totalWins')
          .sort({ totalAuctions: -1 })
          .skip((parseInt(page) - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean();
        break;

      case 'top_players':
        if (minAuctions) query.totalAuctions = { ...query.totalAuctions, $gte: parseInt(minAuctions) };
        if (maxAuctions) query.totalAuctions = { ...query.totalAuctions, $lte: parseInt(maxAuctions) };
        users = await User.find(query)
          .select('user_id username email mobile userCode totalAuctions totalWins totalAmountSpent')
          .sort({ totalAuctions: -1, totalWins: -1 })
          .skip((parseInt(page) - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean();
        break;

      case 'winners':
        if (minWins) query.totalWins = { ...query.totalWins, $gte: parseInt(minWins) };
        if (maxWins) query.totalWins = { ...query.totalWins, $lte: parseInt(maxWins) };
        query.totalWins = query.totalWins || { $gt: 0 };
        users = await User.find(query)
          .select('user_id username email mobile userCode totalAuctions totalWins totalAmountWon')
          .sort({ totalWins: -1 })
          .skip((parseInt(page) - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean();
        break;

      case 'never_played':
        query.totalAuctions = 0;
        users = await User.find(query)
          .select('user_id username email mobile userCode createdAt')
          .sort({ createdAt: -1 })
          .skip((parseInt(page) - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean();
        break;

      case 'auction_participants':
        if (!auctionId) {
          return res.status(400).json({ success: false, message: 'Auction ID required for this filter' });
        }
        const auctionHistories = await AuctionHistory.find({ hourlyAuctionId: auctionId })
          .select('userId username userCode mobile email finalRound isWinner')
          .lean();
        
        users = auctionHistories.map(h => ({
          user_id: h.userId,
          username: h.username,
          userCode: h.userCode,
          mobile: h.mobile,
          email: h.email,
          finalRound: h.finalRound,
          isWinner: h.isWinner,
        }));
        break;

      case 'round1_players':
        if (!auctionId) {
          return res.status(400).json({ success: false, message: 'Auction ID required for this filter' });
        }
        const round1Histories = await AuctionHistory.find({ 
          hourlyAuctionId: auctionId,
          finalRound: { $gte: 1 }
        }).select('userId username userCode mobile email finalRound').lean();
        
        users = round1Histories.map(h => ({
          user_id: h.userId,
          username: h.username,
          userCode: h.userCode,
          mobile: h.mobile,
          email: h.email,
          finalRound: h.finalRound,
        }));
        break;

      case 'advanced_round2':
        if (!auctionId) {
          return res.status(400).json({ success: false, message: 'Auction ID required for this filter' });
        }
        const round2Histories = await AuctionHistory.find({ 
          hourlyAuctionId: auctionId,
          finalRound: { $gte: 2 }
        }).select('userId username userCode mobile email finalRound').lean();
        
        users = round2Histories.map(h => ({
          user_id: h.userId,
          username: h.username,
          userCode: h.userCode,
          mobile: h.mobile,
          email: h.email,
          finalRound: h.finalRound,
        }));
        break;

      case 'eliminated_current':
        if (!auctionId) {
          return res.status(400).json({ success: false, message: 'Auction ID required for this filter' });
        }
        const auction = await HourlyAuction.findOne({ hourlyAuctionId: auctionId }).lean();
        if (!auction) {
          return res.status(404).json({ success: false, message: 'Auction not found' });
        }
        
        const eliminatedHistories = await AuctionHistory.find({ 
          hourlyAuctionId: auctionId,
          isWinner: false,
          finalRound: { $lt: auction.roundCount }
        }).select('userId username userCode mobile email finalRound').lean();
        
        users = eliminatedHistories.map(h => ({
          user_id: h.userId,
          username: h.username,
          userCode: h.userCode,
          mobile: h.mobile,
          email: h.email,
          finalRound: h.finalRound,
          eliminatedInRound: h.finalRound,
        }));
        break;

      case 'specific_round':
        if (!auctionId || !round) {
          return res.status(400).json({ success: false, message: 'Auction ID and round required for this filter' });
        }
        const roundHistories = await AuctionHistory.find({ 
          hourlyAuctionId: auctionId,
          finalRound: parseInt(round)
        }).select('userId username userCode mobile email finalRound isWinner').lean();
        
        users = roundHistories.map(h => ({
          user_id: h.userId,
          username: h.username,
          userCode: h.userCode,
          mobile: h.mobile,
          email: h.email,
          finalRound: h.finalRound,
          isWinner: h.isWinner,
        }));
        break;

      case 'claim_pending':
        const pendingClaims = await AuctionHistory.find({ 
          isWinner: true,
          prizeClaimStatus: 'PENDING'
        }).select('userId username userCode mobile email prizeAmountWon').lean();
        
        users = pendingClaims.map(h => ({
          user_id: h.userId,
          username: h.username,
          userCode: h.userCode,
          mobile: h.mobile,
          email: h.email,
          prizeAmountWon: h.prizeAmountWon,
        }));
        break;

      default:
        users = await User.find(query)
          .select('user_id username email mobile userCode totalAuctions totalWins')
          .sort({ createdAt: -1 })
          .skip((parseInt(page) - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean();
    }

    const usersWithMobile = users.filter(u => u.mobile);

    let totalCount;
    if (['auction_participants', 'round1_players', 'advanced_round2', 'eliminated_current', 'specific_round', 'claim_pending'].includes(filter)) {
      totalCount = usersWithMobile.length;
    } else {
      totalCount = await User.countDocuments(query);
    }

    return res.status(200).json({
      success: true,
      data: usersWithMobile,
      meta: {
        total: totalCount,
        withMobile: usersWithMobile.length,
        page: parseInt(page),
        limit: parseInt(limit),
        filter,
      },
    });
  } catch (error) {
    console.error('Get Users For SMS Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getRecentAuctions = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const auctions = await HourlyAuction.find({})
      .select('hourlyAuctionId hourlyAuctionCode auctionName TimeSlot Status auctionDate totalParticipants currentRound roundCount')
      .sort({ auctionDate: -1, TimeSlot: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, data: auctions });
  } catch (error) {
    console.error('Get Recent Auctions Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const sendSmsToUsers = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { userIds, mobileNumbers, message, templateKey, templateVariables, senderId } = req.body;

    if (!message && !templateKey) {
      return res.status(400).json({ success: false, message: 'Message or template required' });
    }

    let finalMessage = message;
    let isRestTemplate = false;
    let restTemplateId = null;

    if (templateKey) {
      if (templateKey.startsWith('rest_')) {
        isRestTemplate = true;
        restTemplateId = templateKey.replace('rest_', '');
        // For REST templates, we use the message from the template service later
      } else {
        const formatted = formatTemplate(templateKey, templateVariables || {});
        if (!formatted.success) {
          return res.status(400).json({ success: false, message: formatted.error });
        }
        finalMessage = formatted.message;
      }
    }

    let recipients = [];

    if (mobileNumbers && mobileNumbers.length > 0) {
      recipients = mobileNumbers;
    } else if (userIds && userIds.length > 0) {
      const users = await User.find({ user_id: { $in: userIds } }).select('mobile').lean();
      recipients = users.filter(u => u.mobile).map(u => u.mobile);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid mobile numbers to send SMS' });
    }

    let result;
    if (isRestTemplate) {
      // SMSCountry REST API doesn't support sending by TemplateId directly in the simple SMS endpoint 
      // in the way specified, so we fetch the template message first
      const tplResult = await smsRestService.getTemplates();
      const template = tplResult.data?.find(t => t.TemplateId == restTemplateId);
      if (!template) return res.status(400).json({ success: false, message: 'REST Template not found' });
      finalMessage = template.Message;
      
      // Now send using REST service
      if (recipients.length === 1) {
        result = await smsRestService.sendSms(recipients[0], finalMessage, senderId);
      } else {
        result = await smsRestService.sendBulkSms(recipients, finalMessage, senderId);
      }
    } else {
      // Use existing service or REST service for custom messages
      if (recipients.length === 1) {
        result = await smsRestService.sendSms(recipients[0], finalMessage, senderId);
      } else {
        result = await smsRestService.sendBulkSms(recipients, finalMessage, senderId);
      }
    }

    return res.status(200).json({
      success: result.success,
      message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
      data: {
        recipientCount: recipients.length,
        ...result,
      },
    });
  } catch (error) {
    console.error('Send SMS Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const sendBulkSmsToFilter = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { filter, filterParams, message, templateKey, templateVariables, senderId } = req.body;

    if (!message && !templateKey) {
      return res.status(400).json({ success: false, message: 'Message or template required' });
    }

    let finalMessage = message;
    let isRestTemplate = false;
    let restTemplateId = null;

    if (templateKey) {
      if (templateKey.startsWith('rest_')) {
        isRestTemplate = true;
        restTemplateId = templateKey.replace('rest_', '');
      } else {
        const formatted = formatTemplate(templateKey, templateVariables || {});
        if (!formatted.success) {
          return res.status(400).json({ success: false, message: formatted.error });
        }
        finalMessage = formatted.message;
      }
    }

    let query = { isDeleted: false, userType: 'USER', mobile: { $exists: true, $ne: '' } };
    let users = [];

    switch (filter) {
      case 'all':
        users = await User.find(query).select('mobile').lean();
        break;
      case 'active_players':
        query.totalAuctions = { $gt: 0 };
        users = await User.find(query).select('mobile').lean();
        break;
      case 'winners':
        query.totalWins = { $gt: 0 };
        users = await User.find(query).select('mobile').lean();
        break;
      case 'never_played':
        query.totalAuctions = 0;
        users = await User.find(query).select('mobile').lean();
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid filter' });
    }

    const recipients = users.map(u => u.mobile).filter(Boolean);

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No users match the filter criteria' });
    }

    if (isRestTemplate && !finalMessage) {
      const tplResult = await smsRestService.getTemplates();
      const template = tplResult.data?.find(t => t.TemplateId == restTemplateId);
      if (!template) return res.status(400).json({ success: false, message: 'REST Template not found' });
      finalMessage = template.Message;
    }

    const result = await smsRestService.sendBulkSms(recipients, finalMessage, senderId);

    return res.status(200).json({
      success: result.success,
      message: result.success ? 'Bulk SMS sent successfully' : 'Failed to send bulk SMS',
      data: {
        filter,
        recipientCount: recipients.length,
        ...result,
      },
    });
  } catch (error) {
    console.error('Send Bulk SMS Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getFilterStats = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.headers['x-user-id'];
    const admin = await verifyAdmin(adminId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const baseQuery = { isDeleted: false, userType: 'USER', mobile: { $exists: true, $ne: '' } };

    const [
      allUsers,
      activePlayers,
      winners,
      neverPlayed,
      claimPending,
    ] = await Promise.all([
      User.countDocuments(baseQuery),
      User.countDocuments({ ...baseQuery, totalAuctions: { $gt: 0 } }),
      User.countDocuments({ ...baseQuery, totalWins: { $gt: 0 } }),
      User.countDocuments({ ...baseQuery, totalAuctions: 0 }),
      AuctionHistory.countDocuments({ isWinner: true, prizeClaimStatus: 'PENDING' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        all: allUsers,
        active_players: activePlayers,
        winners,
        never_played: neverPlayed,
        claim_pending: claimPending,
      },
    });
  } catch (error) {
    console.error('Get Filter Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getRestTemplates,
  createRestTemplate,
  deleteRestTemplate,
  getSenderIds,
  getSmsReports,
  getSmsStatus,
  getSmsTemplates,
  getSmsBalance,
  getUsersForSms,
  getRecentAuctions,
  sendSmsToUsers,
  sendBulkSmsToFilter,
  getFilterStats,
};
