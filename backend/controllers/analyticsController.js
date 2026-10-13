const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { isSupabaseConfigured, analyticsService } = require('../services/supabaseService');

exports.getSummary = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const summary = await analyticsService.getSummary();
      if (summary) {
        return res.json({
          success: true,
          data: summary
        });
      }
    }

    const orders = await Order.find();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    const todayOrders = orders.filter(o => new Date(o.createdAt) >= startOfToday);
    const yesterdayOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= startOfYesterday && d < startOfToday;
    });

    // Revenue calculations
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const todayPaidOrders = todayOrders.filter(o => o.paymentStatus === 'PAID');
    const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const yesterdayPaidOrders = yesterdayOrders.filter(o => o.paymentStatus === 'PAID');
    const yesterdayRevenue = yesterdayPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const cashPaidOrders = orders.filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PAID');
    const cashSales = cashPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const onlinePaidOrders = orders.filter(o => o.paymentMethod === 'ONLINE' && o.paymentStatus === 'PAID');
    const onlineSales = onlinePaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingPaymentsCount = orders.filter(o => o.paymentStatus === 'PENDING').length;
    const failedPaymentsCount = orders.filter(o => o.paymentStatus === 'FAILED').length;

    const totalOrdersCount = orders.length;
    const completedOrdersCount = orders.filter(o => o.status === 'Completed').length;
    const preparingOrdersCount = orders.filter(o => o.status === 'Preparing').length;
    const readyOrdersCount = orders.filter(o => o.status === 'Ready').length;
    const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;

    const aov = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
    const cashPercentage = totalRevenue > 0 ? Math.round((cashSales / totalRevenue) * 100) : 0;
    const onlinePercentage = totalRevenue > 0 ? Math.round((onlineSales / totalRevenue) * 100) : 0;

    // Item popularity aggregation from order items
    const itemCounts = {};
    const itemRevenue = {};
    orders.forEach(o => {
      o.items.forEach(i => {
        const name = i.name;
        itemCounts[name] = (itemCounts[name] || 0) + i.quantity;
        itemRevenue[name] = (itemRevenue[name] || 0) + (i.price * i.quantity);
      });
    });

    const sortedDishes = Object.keys(itemCounts)
      .map(name => ({
        name,
        quantity: itemCounts[name],
        revenue: itemRevenue[name]
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const topFood = sortedDishes.length > 0 ? sortedDishes[0].name : 'Masala Dosa';

    // Financial analysis (Estimates clearly labeled)
    const estimatedIngredientCostRate = 0.45; // 45% ingredient cost
    const estimatedCost = Math.round(totalRevenue * estimatedIngredientCostRate);
    const estimatedGrossMargin = totalRevenue - estimatedCost;

    // Active crowd estimation from preparing + confirmed queue
    const activeQueue = orders.filter(o => ['Confirmed', 'Preparing'].includes(o.status)).length;
    let crowdLevel = 'LOW';
    if (activeQueue > 25) crowdLevel = 'VERY HIGH';
    else if (activeQueue > 12) crowdLevel = 'HIGH';
    else if (activeQueue > 5) crowdLevel = 'MEDIUM';

    res.json({
      success: true,
      data: {
        paymentBreakdown: {
          cash: { total: cashSales, count: cashPaidOrders.length },
          online: { total: onlineSales, count: onlinePaidOrders.length }
        },
        financialEstimates: {
          totalRevenue,
          estimatedIngredientCosts: estimatedCost,
          estimatedGrossMargin,
          benchmarkRate: '45%'
        },
        sales: {
          totalRevenue,
          paidRevenue: totalRevenue,
          pendingRevenue: orders.filter(o => o.paymentStatus === 'PENDING').reduce((sum, o) => sum + o.totalAmount, 0)
        },
        orderStatusCounts: {
          Confirmed: orders.filter(o => o.status === 'Confirmed').length,
          Preparing: preparingOrdersCount,
          Ready: readyOrdersCount,
          Completed: completedOrdersCount,
          Cancelled: cancelledOrdersCount
        },
        crowdMetrics: {
          activeQueueLength: activeQueue,
          crowdLevel,
          avgWaitMinutes: activeQueue * 4 + 5
        },
        topSellingItem: topFood,
        topDishes: sortedDishes.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
};
