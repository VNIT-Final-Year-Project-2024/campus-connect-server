const { executeQuery } = require('../utils/queryExectutor');
const otpGen = require('../utils/otpgen');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/tokengen');
const { validateRequest } = require('../utils/requestValidator');

const verifyStudent = (req, res) => {
  // validate request body
  let requiredFields = ['emailPrefix', 'name', 'password', 'studentId'];
  validateRequest(req, res, requiredFields);

  console.log(`User: ${req.body.name} requested OTP`);
  // generate OTP for student mail verification
  otpGen.generateOtp(req, res, 'student');
};

const verifyFaculty = (req, res) => {
  // validate request body
  let requiredFields = ['emailPrefix', 'name', 'password', 'facultyId', 'dept', 'type'];
  validateRequest(req, res, requiredFields);

  console.log(`User: ${req.body.name} requested OTP`);
  // generate OTP for faculty mail verification
  otpGen.generateOtp(req, res, 'faculty');
};

const addStudent = async (req, res) => {

  // validate request body
  const requiredFields = ['token', 'otp'];
  validateRequest(req, res, requiredFields);

  let user = otpGen.checkOtp(req, res);

  if (user) {
    let query;
    var {studentId, emailPrefix, name, password} = user;
    let passwordHash = await bcrypt.hash(password, 10);
    let email = emailPrefix + '@students.vnit.ac.in';
    
    // SQL query to insert student
    query = `INSERT INTO student (student_id, email, name, password) VALUES ("${studentId}", "${email}", "${name}", "${passwordHash}");`;
    // using the executeQuery function
    executeQuery(query, (error, results) => {
      if (error) {
        res.status(500).json(error);
      }

      // send the results as JSON
      res.json({'status': 'success'});
      console.log(`User: ${name} added in student DB`)
    });
  }
}

const addFaculty = async (req, res) => {

  // validate request body
  const requiredFields = ['token', 'otp'];
  validateRequest(req, res, requiredFields);

  let user = otpGen.checkOtp(req, res);

  if (user) {
    let query;
    var {facultyId, emailPrefix, dept, name, password} = user;
    let passwordHash = await bcrypt.hash(password, 10);
    let email = emailPrefix + '@' + obj.dept + '.vnit.ac.in';

    // SQL query to insert faculty
    query = `INSERT INTO faculty (faculty_id, email, name, dept, password) VALUES ("${facultyId}", "${email}", "${dept}", "${name}", "${passwordHash}");`;
    // using the executeQuery function
    executeQuery(query, (error, results) => {
      if (error) {
        res.status(500).json(error);
      }

      // send the results as JSON
      res.json({'status': 'success'});
      console.log(`User: ${name} added in faculty DB`)
    });
  }
}

const loginStudent = async (req, res) => {
  // validate request body
  const requiredFields = ['email', 'password'];
  validateRequest(req, res, requiredFields);

  let email = req.body.email;

  // SQL query to find student
  let query = `SELECT * FROM student WHERE email = '${email}' LIMIT 1`;
  // using the executeQuery function
  executeQuery(query, async (error, results) => {
    if (error) {
      res.status(500).json(error);
    }

    if(results.length === 0) {
      res.send({'status': 'failed'});
    }
  
    // append the response with the extracted information
    const { student_id, email, name } = results[0];
    let userResponse = {
      student_id,
      email,
      name,
    };
    // userResponse.type = 'student';
  
    let passwordHash = results[0].password;
    let password = req.body.password;

    bcrypt.compare(password, passwordHash, (err, result) => {
      if (err) {
        res.status(500).json(error);
        console.error(err);
      } else if (result) {
        // passwords match
        userResponse.status = 'success';
        userResponse.token = generateToken(userResponse);
        console.log(`User: ${userResponse.name} logged in`);
        res.json(userResponse);
      } else {
        // passwords do not match
        res.send({'status': 'failed'});
      }
    });
  });
}

const loginFaculty = async (req, res) => {
  // validate request body
  const requiredFields = ['email', 'password'];
  validateRequest(req, res, requiredFields);

  let email = req.body.email;

  l// SQL query to find faculty
  let query = `SELECT * FROM faculty WHERE email = '${email}' LIMIT 1`;
  // Using the executeQuery function
  executeQuery(query, async (error, results) => {
    if (error) {
      res.status(500).json(error);
    }

    if(results.length === 0) {
      res.send({'status': 'failed'});
    }
  
    // append the response with the extracted information
    const { faculty_id, email, name } = results[0];
    let userResponse = {
      faculty_id,
      email,
      dept,
      name,
    };
    // userResponse.type = 'faculty';
  
    let passwordHash = results[0].password;
    let password = req.body.password;

    bcrypt.compare(password, passwordHash, (err, result) => {
      if (err) {
        res.status(500).json(error);
        console.error(err);
      } else if (result) {
        // Passwords match
        userResponse.status = 'success';
        userResponse.token = generateToken(userResponse);
        console.log(`User: ${userResponse.name} logged in`);
        res.json(userResponse);
      } else {
        // Passwords do not match
        res.send({'status': 'failed'});
      }
    });
  });
}

// export the controller function for use in Express routes
module.exports = { 
  verifyStudent, addStudent, loginStudent,
  verifyFaculty, addFaculty, loginFaculty
};