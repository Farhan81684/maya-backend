const pool = require("../config/db.config");
const moment = require("moment");

exports.getDashboardData = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || "This Month";

    const [allRows] = await pool.query(`SELECT * FROM dashboard`);
    const now = moment();
    let startDate;

    switch (timeframe) {
      case "Today":
        startDate = now.clone().startOf("day");
        break;
      case "This Week":
        startDate = now.clone().startOf("week");
        break;
      case "This Month":
        startDate = now.clone().startOf("month");
        break;
      case "This Quarter":
        startDate = now.clone().startOf("quarter");
        break;
      case "This Year":
        startDate = now.clone().startOf("year");
        break;
      case "Last Week":
        startDate = now.clone().subtract(1, "week").startOf("week");
        break;
      case "Last Month":
        startDate = now.clone().subtract(1, "month").startOf("month");
        break;
      case "Last Quarter":
        startDate = now.clone().subtract(1, "quarter").startOf("quarter");
        break;
      case "Last Year":
        startDate = now.clone().subtract(1, "year").startOf("year");
        break;
      default:
        startDate = now.clone().startOf("month");
    }

    const filteredRows = allRows.filter((row) =>
      moment.utc(row.createdAt).local().isSameOrAfter(startDate)
    );

    // Step 1: Pre-fill full chartMap with 0 values
    const chartMap = {};

    if (timeframe === "Today") {
      for (let hour = 0; hour < 24; hour++) {
        // Fixed: Use consistent format for both key generation and data matching
        const key = `${hour.toString().padStart(2, '0')}:00`;
        chartMap[key] = { day: key, conversations: 0, meetings: 0 };
      }
    } else if (["This Week", "Last Week"].includes(timeframe)) {
      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      daysOfWeek.forEach((day) => {
        chartMap[day] = { day, conversations: 0, meetings: 0 };
      });
    } else if (["This Month", "Last Month"].includes(timeframe)) {
      const daysInMonth =
        timeframe === "Last Month"
          ? now.clone().subtract(1, "month").daysInMonth()
          : now.daysInMonth();

      const base = timeframe === "Last Month"
        ? now.clone().subtract(1, "month").startOf("month")
        : now.clone().startOf("month");

      for (let d = 0; d < daysInMonth; d++) {
        const key = base.clone().add(d, "days").format("D MMM");
        chartMap[key] = { day: key, conversations: 0, meetings: 0 };
      }
    } else if (
      ["This Quarter", "Last Quarter", "This Year", "Last Year"].includes(timeframe)
    ) {
      const months = moment.monthsShort(); // ['Jan', 'Feb', ..., 'Dec']
      let quarterMonths;

      if (["This Quarter", "Last Quarter"].includes(timeframe)) {
        const quarterBase = ["This Quarter"].includes(timeframe)
          ? now
          : now.clone().subtract(1, "quarter");
        const quarter = Math.floor(quarterBase.month() / 3);
        quarterMonths = months.slice(quarter * 3, quarter * 3 + 3);
      } else {
        quarterMonths = months;
      }

      quarterMonths.forEach((month) => {
        chartMap[month] = { day: month, conversations: 0, meetings: 0 };
      });
    }

    // Step 2: Fill chartMap with actual data
    filteredRows.forEach((row) => {
      const created = moment.utc(row.createdAt).local();

      let key;

      if (timeframe === "Today") {
        // Fixed: Use consistent HH:00 format to match the keys in chartMap
        key = `${created.hour().toString().padStart(2, '0')}:00`;
      } else if (["This Week", "Last Week"].includes(timeframe)) {
        key = created.format("ddd");
      } else if (["This Month", "Last Month"].includes(timeframe)) {
        key = created.format("D MMM");
      } else {
        key = created.format("MMM");
      }

      if (chartMap[key]) {
        chartMap[key].conversations += 1;
        if (row.isMeetingBooked) chartMap[key].meetings += 1;
      }
    });

    // Step 3: Sort chartData
    const chartData = Object.values(chartMap).sort((a, b) => {
      if (timeframe === "Today") {
        // For hourly data, sort by hour
        const hourA = parseInt(a.day.split(':')[0]);
        const hourB = parseInt(b.day.split(':')[0]);
        return hourA - hourB;
      } else {
        // For other timeframes, use moment parsing
        return moment(a.day, "HH:mm D MMM MMM ddd") - moment(b.day, "HH:mm D MMM MMM ddd");
      }
    });

    // Step 4: Metrics
    const totalMessages = filteredRows.reduce((sum, row) => {
      const msgCount = parseInt(row.messages);
      return sum + (isNaN(msgCount) ? 0 : msgCount);
    }, 0);

    const tatalConversations = filteredRows.length;
    const totalMeetingsBooked = filteredRows.reduce(
      (acc, row) => acc + (row.isMeetingBooked ? 1 : 0),
      0
    );
    const totalSPVClicked = filteredRows.reduce(
      (acc, row) => acc + (row.isSPVclicked ? 1 : 0),
      0
    );

    // Step 5: Response
    res.json({
      chartData,
      tatalConversations,
      totalMessages,
      totalMeetingsBooked,
      totalSPVClicked,
      averageMessagesPerConversation:
        totalMessages / (tatalConversations || 1),
      averageMeetingsBookedPerConversation:
        totalMeetingsBooked / (tatalConversations || 1),
      averageSPVClickedPerConversation:
        totalSPVClicked / (tatalConversations || 1),
      timeframe,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

//insert data
exports.insertDashboardData = async (req, res) => {
  try {
    const { messages, isMeetingBooked, isSPVclicked } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "messages field is required" });
    }

    console.log("messages:", messages);
    console.log("isMeetingBooked:", isMeetingBooked);
    console.log("isSPVclicked:", isSPVclicked);

    const query = `
      INSERT INTO dashboard (messages, isMeetingBooked, isSPVclicked)
      VALUES (?, ?, ?)
    `;
    const values = [messages, !!isMeetingBooked, !!isSPVclicked];

    const [result] = await pool.execute(query, values);

    res.status(201).json({ success: true, insertedId: result.insertId });
  } catch (err) {
    console.error("Dashboard insert error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};