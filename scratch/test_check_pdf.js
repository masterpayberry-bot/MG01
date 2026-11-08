const fs = require('fs');
const { execSync } = require('child_process');

// Let's test calling php api/index.php with action=check_cnh_pdf
try {
  const res = execSync('php -r "$_GET[\'action\']=\'check_cnh_pdf\'; $_GET[\'cpf\']=\'12345678901\'; include \'api/index.php\';"').toString();
  console.log('PHP check_cnh_pdf test result:', res);
} catch(e) {
  console.log('Error testing check_cnh_pdf:', e.message);
}
