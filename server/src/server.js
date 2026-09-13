const app = require('./app');
const { runBootstrap } = require('./bootstrap');

const port = process.env.PORT || 4000;

runBootstrap()
  .then(() => {
    app.listen(port, () => {
      console.log(`Honnibear API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Startup failed during database bootstrap:', err);
    process.exit(1);
  });
