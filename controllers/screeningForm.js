const pool = require('../config/db.config');



//submit form
exports.submitForm = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: 'No form data provided.' });
}
  try {
    const {
      user_id,
      first_name,
      last_name,
      date_of_birth,
      sex,
      support_text,
      therapist_history,
      emotional_score_1,
      session_type_1,
      emotional_score_2,
      session_type_2,
    } = req.body;
console.log(req.body)
    // if (
    //   !user_id ||
    //   !first_name ||
    //   !last_name ||
    //   !date_of_birth ||
    //   !sex ||
    //   !support_text ||
    //   !therapist_history ||
    //   !emotional_score_1 ||
    //   !session_type_1 ||
    //   !emotional_score_2 ||
    //   !session_type_2
    // ) {
    //   return res.status(400).json({ error: 'Missing required fields.' });
    // }
console.log("sad")
    await pool.query(
      `INSERT INTO screening_forms (user_id, first_name, last_name, date_of_birth, sex, support_text, therapist_history, emotional_score_1, session_type_1, emotional_score_2, session_type_2)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, first_name, last_name, date_of_birth, sex, support_text, therapist_history, emotional_score_1, session_type_1, emotional_score_2, session_type_2]
    );

    res.status(200).json({ message: "Form submitted successfully." });
  } catch (error) {
    console.error('Error inserting screening form:', error.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}
