const Order = require('../models/Order');
const { isSupabaseConfigured, orderService } = require('../services/supabaseService');

const PICKUP_SLOTS = [
  '11:45 AM – 12:00 PM',
  '12:00 PM – 12:15 PM',
  '12:15 PM – 12:30 PM',
  '12:30 PM – 12:45 PM',
  '12:45 PM – 01:00 PM',
  '01:00 PM – 01:15 PM',
  '01:15 PM – 01:30 PM',
  '01:30 PM – 01:45 PM'
];

exports.getCrowdStatus = async (req, res, next) => {
  try {
    const branch = req.query.branch || 'Main Canteen';
    let activeOrders = [];

    if (isSupabaseConfigured()) {
      const allOrders = await orderService.getAllOrders({ branch });
      activeOrders = allOrders.filter(o => ['Confirmed', 'Preparing', 'Ready'].includes(o.status));
    } else {
      activeOrders = await Order.find({
        branch,
        status: { $in: ['Confirmed', 'Preparing', 'Ready'] }
      });
    }

    const waitingCount = activeOrders.filter(o => o.status === 'Confirmed').length;
    const preparingCount = activeOrders.filter(o => o.status === 'Preparing').length;
    const readyCount = activeOrders.filter(o => o.status === 'Ready').length;
    const totalActive = activeOrders.length;

    // Determine real crowd level
    let crowdLevel = 'LOW CROWD';
    let crowdColor = 'text-emerald-600 bg-emerald-50';
    let avgWaitMinutes = 8;

    if (totalActive > 30) {
      crowdLevel = 'VERY HIGH CROWD';
      crowdColor = 'text-rose-600 bg-rose-50';
      avgWaitMinutes = 30;
    } else if (totalActive > 15) {
      crowdLevel = 'HIGH CROWD';
      crowdColor = 'text-orange-600 bg-orange-50';
      avgWaitMinutes = 20;
    } else if (totalActive > 6) {
      crowdLevel = 'MEDIUM CROWD';
      crowdColor = 'text-amber-600 bg-amber-50';
      avgWaitMinutes = 12;
    }

    // Calculate queue depth per pickup slot
    const slotCounts = {};
    PICKUP_SLOTS.forEach(s => slotCounts[s] = 0);

    activeOrders.forEach(o => {
      if (o.pickupWindow && slotCounts[o.pickupWindow] !== undefined) {
        slotCounts[o.pickupWindow]++;
      }
    });

    // Find recommended slot (least crowded slot)
    let recommendedSlot = PICKUP_SLOTS[0];
    let minSlotLoad = Infinity;
    PICKUP_SLOTS.forEach(slot => {
      const load = slotCounts[slot];
      if (load < minSlotLoad) {
        minSlotLoad = load;
        recommendedSlot = slot;
      }
    });

    // If user provided their orderId or token, calculate their exact queue position
    let userQueueInfo = null;
    if (req.query.orderId || req.query.tokenNumber) {
      let myOrder = null;
      if (isSupabaseConfigured()) {
        const all = await orderService.getAllOrders();
        myOrder = all.find(o => o.id === req.query.orderId || o.orderNumber === req.query.orderId || o.tokenNumber === req.query.tokenNumber);
      } else {
        const targetQuery = req.query.orderId ? { _id: req.query.orderId } : { tokenNumber: req.query.tokenNumber };
        myOrder = await Order.findOne(targetQuery);
      }

      if (myOrder && ['Confirmed', 'Preparing'].includes(myOrder.status)) {
        const ordersAhead = activeOrders.filter(o =>
          new Date(o.createdAt) < new Date(myOrder.createdAt) &&
          ['Confirmed', 'Preparing'].includes(o.status)
        ).length;

        userQueueInfo = {
          orderNumber: myOrder.orderNumber,
          tokenNumber: myOrder.tokenNumber,
          queuePosition: ordersAhead + 1,
          ordersAhead,
          estimatedWaitMinutes: Math.max(3, (ordersAhead + 1) * 3),
          pickupWindow: myOrder.pickupWindow || recommendedSlot
        };
      }
    }

    res.json({
      success: true,
      data: {
        branch,
        crowdLevel,
        crowdColor,
        totalActiveOrders: totalActive,
        ordersWaiting: waitingCount,
        ordersPreparing: preparingCount,
        ordersReady: readyCount,
        averageWaitMinutes: avgWaitMinutes,
        recommendedSlot,
        recommendationReason: `Lower queue load (${minSlotLoad} active orders in this window).`,
        slots: PICKUP_SLOTS.map(s => ({
          slot: s,
          activeOrders: slotCounts[s],
          status: slotCounts[s] > 10 ? 'HEAVY' : slotCounts[s] > 4 ? 'MODERATE' : 'OPTIMAL'
        })),
        userQueueInfo
      }
    });
  } catch (err) {
    next(err);
  }
};
