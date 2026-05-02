// Gelişmiş CORS middleware'i
module.exports = function(req, res, next) {
  // Socket.IO yollarını atla (kendi CORS'unu kullanır)
  if (req.path.startsWith('/socket.io')) {
    return next();
  }

  // Tüm origin'lere izin ver
  res.header('Access-Control-Allow-Origin', '*');
  
  // İzin verilen HTTP metodları
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,HEAD');
  
  // İzin verilen header'lar (Socket.IO için gerekli header'lar dahil)
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma,X-Client-Key,X-Session-ID');
  
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
