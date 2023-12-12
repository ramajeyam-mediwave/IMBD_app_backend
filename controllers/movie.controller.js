const { models } = require("../config/sequelize-config");
const config = require("../config/config");

const addMovieController = async (req, res, next) => {
  try {
    const searchMovie = await models.movies.findAll({
      attributes: ["movie_name"],
      where: { movie_name: req.body.movie_name },
    });
    if (searchMovie.length == 0) {
      const movieCreate = await models.movies.create({
        movie_name: req.body.movie_name,
        release_year: req.body.release_year,
        movie_desc: req.body.movie_desc,
        user_id: req.decoded.user_id,
        image: req.body.image,       });

      // const addedMovie = await models.movies.findByPk(movieCreate.movie_id);

      res.json({
        movieCreate,
      });
    } else {
      return next({
        status: 400,
        message: "movie already exits",
      });
    }
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
};
const getAllMovieController = async (req, res, next) => {
  try {
    const getMovie = await models.movies.findAll({
      attributes: ["movie_name", "release_year", "image"],
    });
    res.json(getMovie);
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
};
module.exports = {
  addMovieController,
  getAllMovieController,
};
