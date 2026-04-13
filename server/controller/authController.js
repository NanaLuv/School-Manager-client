const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getRateLimitStatus, clearFailedAttempts } = require("../middleware/rateLimiter");

//  JWT secret 
const JWT_SECRET =
  process.env.JWT_SECRET;

// GET /api/roles - Get all roles for dropdown
const getRoles = async (req, res) => {
  try {
    const [roles] = await pool.query(`
      SELECT * FROM roles 
      ORDER BY id
    `);
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// POST /api/users/create - Create new user with bcrypt
const createUser = async (req, res) => {
  try {
    const { username, email, password, role_id, first_name, last_name } =
      req.body;

    // Validate required fields
    if (!username || !password || !role_id) {
      return res.status(400).json({
        error: "Username, password, and role are required",
      });
    }

    // Check if username already exists
    const [existingUsername] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if email already exists
    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role_id, 
        first_name, 
        last_name, 
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [
        username,
        email,
        passwordHash,
        role_id,
        first_name || null,
        last_name || null,
      ]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: result.insertId,
        username,
        role_id,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user without password
    const [newUser] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.created_at,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "User created successfully",
      user: newUser[0],
      token,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// PUT /api/users/:id - Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      role_id,
      first_name,
      last_name,

      is_active,
    } = req.body;

    // Check if user exists
    const [existing] = await pool.query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if username is taken by another user
    const [usernameCheck] = await pool.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, id]
    );

    if (usernameCheck.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if email is taken by another user
    const [emailCheck] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, id]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Update user
    await pool.query(
      `UPDATE users SET 
        username = ?, 
        email = ?, 
        role_id = ?, 
        first_name = ?, 
        last_name = ?, 
        is_active = ?
       WHERE id = ?`,
      [username, email, role_id, first_name, last_name, is_active, id]
    );

    // Return updated user
    const [updatedUser] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.created_at,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?`,
      [id]
    );

    res.json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// DELETE /api/users/:id - Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // await pool.query("DELETE FROM users WHERE id = ?", [id]);
    await pool.query("UPDATE users SET is_active = FALSE WHERE id = ?", [id]);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// POST /api/users/change-password - Change password
const changeUserPassword = async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body;

    // Get current password hash
    const [users] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(
      currentPassword,
      users[0].password_hash
    );

    if (!validPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      passwordHash,
      id,
    ]);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// POST /api/users/login - Login user
// const loginUser = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // Find user
//     const [users] = await pool.query(
//       `SELECT 
//         u.*,
//         r.role_name
//       FROM users u
//       LEFT JOIN roles r ON u.role_id = r.id
//       WHERE u.username = ? AND u.is_active = TRUE`,
//       [username]
//     );

//     if (users.length === 0) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const user = users[0];

//     // Check password
//     const validPassword = await bcrypt.compare(password, user.password_hash);

//     if (!validPassword) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         role: user.role_name,
//         role_id: user.role_id,
//       },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // Remove password from response
//     const { password_hash, ...userWithoutPassword } = user;

//     const results = {
//       message: "Login successful",
//       user: userWithoutPassword,
//       token,
//     };
//     res.json(results);
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ error: "Login failed" });
//   }
// };

// POST /api/users/login - Login user with rate limiting
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get rate limit info from middleware
    const attempt = req.failedAttempt;
    
    // Double-check rate limit (security)
    if (attempt && attempt.count >= 5) {
      const now = Date.now();
      if (now - attempt.timestamp < 3600000) {
        const minutesLeft = Math.ceil((attempt.timestamp + 3600000 - now) / 60000);
        return res.status(429).json({
          error: `Too many failed attempts. Please try again in ${minutesLeft} minutes.`
        });
      }
    }

    // Find user
    const [users] = await pool.query(
      `SELECT 
        u.*,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = ?`,
      [username]
    );

    // Track failed attempt if user not found
    if (users.length === 0) {
      trackFailedAttempt(req);
      
      // Log the attempt
      await pool.query(
        `INSERT INTO user_activity_logs 
         (user_id, action, description, ip_address) 
         VALUES (?, 'login_failed', ?, ?)`,
        [null, `Login attempt for non-existent user: ${username}`, req.ip]
      );
      
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      trackFailedAttempt(req);
      
      // Log the attempt
      await pool.query(
        `INSERT INTO user_activity_logs 
         (user_id, action, description, ip_address) 
         VALUES (?, 'login_failed', ?, ?)`,
        [user.id, 'Account is inactive', req.ip]
      );
      
      return res.status(401).json({ error: "Account is deactivated. Contact administrator." });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      trackFailedAttempt(req);
      
      // Log the failed attempt
      await pool.query(
        `INSERT INTO user_activity_logs 
         (user_id, action, description, ip_address) 
         VALUES (?, 'login_failed', ?, ?)`,
        [user.id, 'Invalid password', req.ip]
      );
      
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(req);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role_name,
        role_id: user.role_id,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Log successful login
    await pool.query(
      `INSERT INTO user_activity_logs 
       (user_id, action, description, ip_address) 
       VALUES (?, 'login_success', ?, ?)`,
      [user.id, `Successful login from IP: ${req.ip}`, req.ip]
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
      rateLimit: {
        remaining: 5 - (req.failedAttempt?.count || 0)
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// Add this new function to get login status
const getLoginStatus = async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // Get rate limit info
    const rateLimitStatus = await getRateLimitStatus(req, res);
    
    // Get last login info
    const [lastLogin] = await pool.query(
      `SELECT created_at as last_attempt, description
       FROM user_activity_logs 
       WHERE action = 'login_success' AND user_id = (
         SELECT id FROM users WHERE username = ?
       )
       ORDER BY created_at DESC 
       LIMIT 1`,
      [username]
    );

    const [failedAttempts] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM user_activity_logs 
       WHERE action = 'login_failed' 
         AND description LIKE ? 
         AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [`%${username}%`]
    );

    res.json({
      rateLimit: rateLimitStatus,
      lastLogin: lastLogin[0] || null,
      recentFailedAttempts: failedAttempts[0]?.count || 0
    });
  } catch (error) {
    console.error("Error getting login status:", error);
    res.status(500).json({ error: "Failed to get login status" });
  }
};


// POST /api/users/change-password-with-default - Change password using default password
const changePasswordWithDefault = async (req, res) => {
  try {
    const { id, defaultPassword, newPassword } = req.body;

    // Get user's current password hash
    const [users] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get default password from system settings
    const [settings] = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'default_password'"
    );

    // If no default password in settings, use a hardcoded one (not recommended for production)
    const defaultPwd = settings.length > 0 ? settings[0].setting_value : 'School@123';

    // Check if provided password matches default
    if (defaultPassword !== defaultPwd) {
      return res.status(400).json({ error: "Invalid default password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      passwordHash,
      id,
    ]);

    // Log the password change
    await pool.query(
      `INSERT INTO user_activity_logs (user_id, action, description, ip_address) 
       VALUES (?, 'password_change', 'Password changed using default password', ?)`,
      [req.user?.id || id, req.ip]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password with default:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// POST /api/users/set-default-password - Set or update default password
const setDefaultPassword = async (req, res) => {
  try {
    const { defaultPassword } = req.body;

    if (!defaultPassword || defaultPassword.length < 6) {
      return res.status(400).json({ error: "Default password must be at least 6 characters" });
    }

    // Check if setting exists
    const [existing] = await pool.query(
      "SELECT id FROM system_settings WHERE setting_key = 'default_password'"
    );

    if (existing.length > 0) {
      // Update existing
      await pool.query(
        "UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'default_password'",
        [defaultPassword]
      );
    } else {
      // Insert new
      await pool.query(
        "INSERT INTO system_settings (setting_key, setting_value, description) VALUES ('default_password', ?, 'System default password for user management')",
        [defaultPassword]
      );
    }

    res.json({ message: "Default password updated successfully" });
  } catch (error) {
    console.error("Error setting default password:", error);
    res.status(500).json({ error: "Failed to set default password" });
  }
};

// GET /api/user-activity-logs - Get all activity logs with pagination and filters
const getUserActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      action,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        l.*,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        r.role_name
      FROM user_activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    
    const params = [];

    // Apply filters
    if (user_id) {
      query += " AND l.user_id = ?";
      params.push(user_id);
    }

    if (action) {
      query += " AND l.action = ?";
      params.push(action);
    }

    if (start_date) {
      query += " AND DATE(l.created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(l.created_at) <= ?";
      params.push(end_date);
    }

    if (search) {
      query += ` AND (
        l.description LIKE ? OR 
        u.username LIKE ? OR 
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR
        l.ip_address LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count for pagination
    const countQuery = query.replace(
      "SELECT l.*, u.username, u.first_name, u.last_name, u.email, r.role_name",
      "SELECT COUNT(*) as total"
    );
    
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add sorting and pagination
    query += " ORDER BY l.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.query(query, params);

    // Get distinct actions for filter dropdown
    const [actions] = await pool.query(
      "SELECT DISTINCT action FROM user_activity_logs ORDER BY action"
    );

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        actions: actions.map(a => a.action)
      }
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
};

// GET /api/user-activity-logs/stats - Get activity statistics
const getUserActivityStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get activity summary
    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        MAX(created_at) as last_activity
      FROM user_activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    // Get actions breakdown
    const [actions] = await pool.query(`
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY action
      ORDER BY count DESC
    `, [days]);

    // Get daily activity trend
    const [trend] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activity_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [days]);

    // Get top active users
    const [topUsers] = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        r.role_name,
        COUNT(*) as activity_count,
        MAX(l.created_at) as last_active
      FROM user_activity_logs l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE l.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY u.id, u.username, u.first_name, u.last_name, r.role_name
      ORDER BY activity_count DESC
      LIMIT 10
    `, [days]);

    res.json({
      summary: summary[0],
      actions,
      trend,
      topUsers
    });
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    res.status(500).json({ error: "Failed to fetch activity statistics" });
  }
};

// GET /api/user-activity-logs/export - Export logs to CSV/Excel
const exportActivityLogs = async (req, res) => {
  try {
    const { start_date, end_date, action } = req.query;

    let query = `
      SELECT 
        l.created_at as 'Timestamp',
        u.username as 'Username',
        CONCAT(u.first_name, ' ', u.last_name) as 'Full Name',
        r.role_name as 'Role',
        l.action as 'Action',
        l.description as 'Description',
        l.ip_address as 'IP Address'
      FROM user_activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    
    const params = [];

    if (start_date) {
      query += " AND DATE(l.created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(l.created_at) <= ?";
      params.push(end_date);
    }

    if (action) {
      query += " AND l.action = ?";
      params.push(action);
    }

    query += " ORDER BY l.created_at DESC";

    const [logs] = await pool.query(query, params);

    res.json(logs);
  } catch (error) {
    console.error("Error exporting activity logs:", error);
    res.status(500).json({ error: "Failed to export activity logs" });
  }
};


module.exports = {
  getRoles,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  loginUser,
  changePasswordWithDefault,
  setDefaultPassword,
  getUserActivityLogs,
  getUserActivityStats,
  exportActivityLogs,
};
