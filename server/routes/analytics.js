const express = require('express');
const { allAsync, getAsync } = require('../database/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const { month, boat_id } = req.query;

    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const [year, mStr] = targetMonth.split('-');
    const currDate = new Date(parseInt(year), parseInt(mStr) - 1, 1);
    currDate.setMonth(currDate.getMonth() - 1);
    const prevMonth = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}`;

    let boatFilter = boat_id ? ' AND boat_id = ' + parseInt(boat_id) : '';

    const currIncomeRow = await getAsync(`SELECT COALESCE(SUM(sale_amount), 0) as total, COALESCE(SUM(pending_payment), 0) as pending FROM income WHERE date LIKE ? ${boatFilter}`, [`${targetMonth}%`]);
    const prevIncomeRow = await getAsync(`SELECT COALESCE(SUM(sale_amount), 0) as total FROM income WHERE date LIKE ? ${boatFilter}`, [`${prevMonth}%`]);

    const currExpenseRow = await getAsync(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date LIKE ? ${boatFilter}`, [`${targetMonth}%`]);
    const prevExpenseRow = await getAsync(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date LIKE ? ${boatFilter}`, [`${prevMonth}%`]);

    const currentIncome = currIncomeRow.total;
    const previousIncome = prevIncomeRow.total;
    const currentExpenses = currExpenseRow.total;
    const previousExpenses = prevExpenseRow.total;

    const currentProfit = currentIncome - currentExpenses;
    const previousProfit = previousIncome - previousExpenses;

    const totalPendingBuyerPayments = currIncomeRow.pending;

    const crewAdvanceRow = await getAsync(`
      SELECT 
        (COALESCE(SUM(CASE WHEN type = 'advance' THEN amount ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN type = 'deduction' THEN amount ELSE 0 END), 0)) as pending_advances
      FROM crew_advances
    `);
    const pendingCrewAdvances = Math.max(0, crewAdvanceRow.pending_advances);

    const categoryBreakdown = await allAsync(`
      SELECT category, SUM(amount) as total_amount
      FROM expenses
      WHERE date LIKE ? ${boatFilter}
      GROUP BY category
      ORDER BY total_amount DESC
    `, [`${targetMonth}%`]);

    const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : { category: 'None', total_amount: 0 };

    const boatPnl = await allAsync(`
      SELECT 
        b.id as boat_id,
        b.name as boat_name,
        COALESCE(SUM(i.sale_amount), 0) as total_income,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE boat_id = b.id AND date LIKE ?), 0) as total_expenses
      FROM boats b
      LEFT JOIN income i ON i.boat_id = b.id AND i.date LIKE ?
      GROUP BY b.id, b.name
    `, [`${targetMonth}%`, `${targetMonth}%`]);

    const boatComparison = boatPnl.map(b => ({
      ...b,
      net_profit: b.total_income - b.total_expenses
    }));

    const monthlyTrends = await allAsync(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN category = 'Diesel' THEN amount ELSE 0 END) as diesel_cost,
        SUM(CASE WHEN category LIKE '%maintenance%' OR category LIKE '%repair%' THEN amount ELSE 0 END) as maintenance_cost,
        SUM(CASE WHEN category LIKE '%salary%' OR category LIKE '%allowance%' THEN amount ELSE 0 END) as crew_cost,
        SUM(amount) as total_expense
      FROM expenses
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `);

    const suggestions = [];

    const currDieselRow = await getAsync(`SELECT COALESCE(SUM(amount), 0) as amt FROM expenses WHERE category = 'Diesel' AND date LIKE ? ${boatFilter}`, [`${targetMonth}%`]);
    const prevDieselRow = await getAsync(`SELECT COALESCE(SUM(amount), 0) as amt FROM expenses WHERE category = 'Diesel' AND date LIKE ? ${boatFilter}`, [`${prevMonth}%`]);
    
    if (prevDieselRow.amt > 0) {
      const dieselDiffPct = Math.round(((currDieselRow.amt - prevDieselRow.amt) / prevDieselRow.amt) * 100);
      if (dieselDiffPct > 15) {
        suggestions.push({
          type: 'warning',
          title: 'Unusual Diesel Expense Alert',
          text: `Diesel expense increased by ${dieselDiffPct}% compared to last month (₹${currDieselRow.amt.toLocaleString('en-IN')} vs ₹${prevDieselRow.amt.toLocaleString('en-IN')}). Check sea trip durations or engine fuel efficiency.`
        });
      }
    }

    const currMaintRow = await getAsync(`SELECT COALESCE(SUM(amount), 0) as amt FROM expenses WHERE (category LIKE '%maintenance%' OR category LIKE '%repair%') AND date LIKE ? ${boatFilter}`, [`${targetMonth}%`]);
    if (currMaintRow.amt > 20000) {
      suggestions.push({
        type: 'alert',
        title: 'High Maintenance Cost Detected',
        text: `Maintenance & repair cost for this period is ₹${currMaintRow.amt.toLocaleString('en-IN')}. Verify mechanic invoices and parts replacement details.`
      });
    }

    if (totalPendingBuyerPayments > 30000) {
      suggestions.push({
        type: 'warning',
        title: 'Pending Buyer Payments Affecting Cash Flow',
        text: `₹${totalPendingBuyerPayments.toLocaleString('en-IN')} is still pending from buyers in ${targetMonth}. Follow up with seafood buyers to secure cash flow.`
      });
    }

    if (pendingCrewAdvances > 25000) {
      suggestions.push({
        type: 'info',
        title: 'Crew Advances are Increasing',
        text: `Total unrecovered crew advances stand at ₹${pendingCrewAdvances.toLocaleString('en-IN')}. Ensure deductions are set in upcoming monthly salary payouts.`
      });
    }

    if (previousProfit > 0 && currentProfit < previousProfit) {
      const profitDropPct = Math.round(((previousProfit - currentProfit) / previousProfit) * 100);
      suggestions.push({
        type: 'alert',
        title: 'Lower Profit Than Last Month',
        text: `Net profit dropped by ${profitDropPct}% compared to last month. Income changed by ${previousIncome ? Math.round(((currentIncome - previousIncome)/previousIncome)*100) : 0}% and expenses changed by ${previousExpenses ? Math.round(((currentExpenses - previousExpenses)/previousExpenses)*100) : 0}%.`
      });
    }

    if (highestCategory.total_amount > 0) {
      suggestions.push({
        type: 'info',
        title: 'Highest Expense Category',
        text: `'${highestCategory.category}' is your top expense category this month, taking ₹${highestCategory.total_amount.toLocaleString('en-IN')} (${currentExpenses ? Math.round((highestCategory.total_amount/currentExpenses)*100) : 0}% of total monthly expense).`
      });
    }

    res.json({
      targetMonth,
      prevMonth,
      currentIncome,
      previousIncome,
      incomeChangePct: previousIncome ? Math.round(((currentIncome - previousIncome) / previousIncome) * 100) : 0,
      currentExpenses,
      previousExpenses,
      expenseChangePct: previousExpenses ? Math.round(((currentExpenses - previousExpenses) / previousExpenses) * 100) : 0,
      currentProfit,
      previousProfit,
      totalPendingBuyerPayments,
      pendingCrewAdvances,
      highestExpenseCategory: highestCategory,
      categoryBreakdown,
      boatComparison,
      monthlyTrends,
      suggestions
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to generate analytics dashboard' });
  }
});

module.exports = router;
