const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    const jsonPath = path.resolve(__dirname, '../accounts.json');
    let accounts;
    
    try {
        const fileData = fs.readFileSync(jsonPath, 'utf8');
        accounts = JSON.parse(fileData);
    } catch (err) {
        console.error('Failed to read JSON file:', err.message);
        process.exit(1);
    }

    let total = accounts.length;
    let registered = 0;
    let alreadyExists = 0;
    let failed = 0;

    for (const account of accounts) {
        try {
            const collegeYear = parseInt(account.year, 10);

            const payload = {
                email: account.email,
                password: account.password,
                confirm_password: account.confirmPassword,
                name: account.fullName,
                branch: account.branch,
                division: account.division,
                college_year: collegeYear
            };

            const response = await axios.post('http://localhost:5000/api/auth/register', payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✓ Registered ${account.fullName}`);
            registered++;

        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                const errorMsg = data.error ? data.error : JSON.stringify(data);

                if (status === 400 && errorMsg.toLowerCase().includes('already registered')) {
                    console.log(`⚠ Already exists: ${account.email}`);
                    alreadyExists++;
                } else {
                    console.log(`✗ Failed: ${account.email}`);
                    console.log(`Reason: ${errorMsg}`);
                    failed++;
                }
            } else if (error.request) {
                console.log(`✗ Failed: ${account.email}`);
                console.log(`Reason: No response from server (is it running?)`);
                failed++;
            } else {
                console.log(`✗ Failed: ${account.email}`);
                console.log(`Reason: ${error.message}`);
                failed++;
            }
        }

        // Add 100-200 ms delay
        await sleep(150);
    }

    console.log('');
    console.log('----------------------------------------');
    console.log(`Total Accounts  : ${total}`);
    console.log(`Registered      : ${registered}`);
    console.log(`Already Exists  : ${alreadyExists}`);
    console.log(`Failed          : ${failed}`);
    console.log('----------------------------------------');
}

run();
