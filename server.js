// Importer les modules nécessaires
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const { engine } = require("express-handlebars");
const fs = require("fs");

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du moteur de templates Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

// Routes pour les pages de démarrage et de téléchargement
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

// Configurer multer pour accepter jusqu'à 3 fichiers, avec stockage en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("images", 3);

// Créer le dossier 'uploads' s'il n'existe pas encore
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Route pour uploader, traiter et sauvegarder les images
app.post("/upload-images", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Erreur lors du téléchargement :", err);
      return res.status(500).json({ message: "Erreur lors du téléchargement", error: err });
    }

    // Vérification du nombre de fichiers uploadés
    if (req.files.length === 0) {
      return res.status(400).json({ message: "Veuillez envoyer au moins une image." });
    } else if (req.files.length > 3) {
      return res.status(400).json({ message: "Vous ne pouvez envoyer que 3 images maximum." });
    }

    try {
      // Traitement des images avec Sharp
      const processedImages = await Promise.all(
        req.files.map(async (file, index) => {
          const processedImageBuffer = await sharp(file.buffer)
            .resize({ width: 250 , height : 250 }) // Ajustez la largeur selon les besoins
            .jpeg({ quality: 10 }) // Compression en JPEG avec qualité 10
            .toBuffer();

          // Nom unique pour chaque image
          const filename = `image_${Date.now()}_${index}.jpg`;
          const filePath = path.join(uploadDir, filename);

          // Sauvegarder l'image dans le dossier 'uploads'
          fs.writeFileSync(filePath, processedImageBuffer);
          console.log("icic")
          console.log(filename)
          // return filename;
        })
      );

      res.json({
        message: "Données et images reçues avec succès !",
        files: processedImages,
      });
    } catch (error) {
      console.error("Erreur lors du traitement des images :", error);
      res.status(500).json({ message: "Erreur lors du traitement des images" });
    }
  });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
