const { mongoose } = require('../db/mongo');

// Log i aktivitetit të përdoruesve
// Ruhet në MongoDB sepse është e dhënë e pasistrukturuar dhe vëllim i lartë
const ActivityLogSchema = new mongoose.Schema({
  business_id:  { type: Number, required: true },
  user_id:      { type: Number, required: true },
  username:     { type: String, required: true },
  action:       { type: String, required: true }, // login, logout, import, update_profile
  details:      { type: mongoose.Schema.Types.Mixed }, // informacion shtesë fleksibël
  ip_address:   { type: String },
  user_agent:   { type: String },
  created_at:   { type: Date, default: Date.now },
});

// Index për kërkime të shpejta
ActivityLogSchema.index({ business_id: 1, created_at: -1 });
ActivityLogSchema.index({ user_id: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);