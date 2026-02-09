// Gelişmiş CORS middleware'i
module.exports = function(req, res, next) {
  // Tüm origin'lere izin ver
  res.header('Access-Control-Allow-Origin', '*');
  
  // İzin verilen HTTP metodları
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,HEAD');
  
  // İzin verilen header'lar
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma');
  
  // Credentials'a izin ver
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Cache control
  res.header('Access-Control-Max-Age', '1728000');
  
  // Content type sniffing'i engelle
  res.header('X-Content-Type-Options', 'nosniff');
  
  // OPTIONS preflight için hızlı cevap
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};
