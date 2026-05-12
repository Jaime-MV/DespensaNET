const bcrypt = require('bcrypt');

async function run() {
  console.log("Admin2024! ->", await bcrypt.hash('Admin2024!', 10));
  console.log("Manager2024! ->", await bcrypt.hash('Manager2024!', 10));
  console.log("Staff2024! ->", await bcrypt.hash('Staff2024!', 10));
}

run();
