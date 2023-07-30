const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauce.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({_id: req.params.id})
      .then((sauce) => {
          if (sauce.userId != req.auth.userId) {
              res.status(403).json({ message : 'Not authorized'});
          } else {
              Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
      .then(sauce => {
          if (sauce.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Sauce.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.likeSauce = (req, res, next) => {
  const sauceId = req.params.id;
  const like = req.body.like;
  const user = req.body.userId;
  // L'utilisateur like une sauce
  if ( like === 1) {
    Sauce.updateOne(
        { _id: sauceId }, 
        {
          $inc: { likes: like },
          $push: { usersLiked: user }
        }
      )
      .then(() => res.status(200).json({message : 'Like ajouté!'}))
      .catch(error => res.status(401).json({ error }));
  // L'utilisateur dislike une sauce
  } else if ( like === -1) {
    Sauce.updateOne(
      { _id: sauceId }, 
      {
        $inc: { dislikes: -like },
        $push: { usersDisliked: user }
      }
    )
      .then(() => res.status(200).json({message : 'Dislike ajouté!'}))
      .catch(error => res.status(401).json({ error }));
  // L'utilisateur retire son like/dislike d'une sauce
  } else {
    Sauce.findOne({ _id: sauceId })
      .then((sauce) => {
        // Si l'utilisateur a déjà "like" une sauce, on retire le like et l'utilisateur du tableau
        if (sauce.usersLiked.includes(user)) {
          Sauce.updateOne(
            { _id: sauceId },
            { $pull: { usersLiked: user }, $inc: { likes: -1 } }
          )
            .then(() =>  res.status(200).json({ message: "Annulation du like" }))
            .catch((error) => res.status(500).json({ error }));
        // Si l'utilisateur à déjà "dislike" une sauce, on retire le dislike et l'utilisateur du tableau
        } else if (sauce.usersDisliked.includes(user)) {
          Sauce.updateOne(
            { _id: sauceId },
            {
              $pull: { usersDisliked: user },
              $inc: { dislikes: -1 },
            }
          )
            .then(() => res.status(200).json({ message: "Annulation du dislike" }))
            .catch((error) => res.status(500).json({ error }));
        }
      })
      .catch((error) => res.status(401).json({ error }));
  }
}