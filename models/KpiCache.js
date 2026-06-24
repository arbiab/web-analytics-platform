const { mongoose } = require('../db/mongo');

// Cache i rezultateve të KPI-ve
// Ruhet në MongoDB për performancë — shmang query-t e rënda të PostgreSQL
const KpiCacheSchema = new mongoose.Schema({
  business_id:  { type: Number, required: true },
  kpi_type:     { type: String, required: true }, // revenue_growth, inventory_turnover
  data:         { type: mongoose.Schema.Types.Mixed, required: true },
  computed_at:  { type: Date, default: Date.now },
  expires_at:   { type: Date, required: true },
});

// Index + TTL (fshihet automatikisht pas skadimit)
KpiCacheSchema.index({ business_id: 1, kpi_type: 1 }, { unique: true });
KpiCacheSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('KpiCache', KpiCacheSchema);