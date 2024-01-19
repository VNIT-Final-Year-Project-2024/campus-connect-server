const { executeQuery } = require('../utils/queryExectutor');
const otpGen = require('../utils/otpgen');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/tokengen');
const { validateRequest } = require('../utils/requestValidator');
const { validateQueryParams } = require('../utils/queryParamValidator');
const { generateJwt } = require('../utils/jwtGenerator');

const verifyStudent = (req, res) => {

  // validate request body
  let requiredFields = ['emailPrefix', 'name', 'password', 'studentId', 'dept'];

  if (validateRequest(req, res, requiredFields)) {

    let email = req.body.emailPrefix + '@students.vnit.ac.in';
    // SQL query to find student
    let query = `SELECT * FROM user WHERE email = '${email}' LIMIT 1`;
    // using the executeQuery function
    executeQuery(query, async (error, results) => {
      if (error) {
        res.status(500).json(error);
        return;
      }
      if (results.length !== 0 || results[0]) {
        res.status(409).send({ 'message': 'user with email already exists' });
        return;
      } else {
        console.log(`User: ${req.body.name} requested OTP`);
        // generate OTP for student mail verification
        otpGen.generateOtp(req, res, 'student');
      }
    });
  }
};

const verifyFaculty = (req, res) => {

  // validate request body
  let requiredFields = ['emailPrefix', 'name', 'password', 'facultyId', 'dept'];

  if (validateRequest(req, res, requiredFields)) {

    let email = req.body.emailPrefix + '@' + req.body.dept + '.vnit.ac.in';
    // SQL query to find student
    let query = `SELECT * FROM user WHERE email = '${email}' LIMIT 1`;
    // using the executeQuery function
    executeQuery(query, async (error, results) => {
      if (error) {
        res.status(500).json(error);
        return;
      }
      if (results.length != 0 || results[0]) {
        res.status(409).send({ 'message': 'user with email already exists' });
        return;
      } else {
        console.log(`User: ${req.body.name} requested OTP`);
        // generate OTP for faculty mail verification
        otpGen.generateOtp(req, res, 'faculty');
      }
    });
  }
};

const addStudent = async (req, res) => {

  // validate request body
  const requiredFields = ['token', 'otp'];
  if (validateRequest(req, res, requiredFields)) {

    let user = otpGen.checkOtp(req, res);

    if (user) {
      let { studentId, emailPrefix, dept, name, password } = user;
      let passwordHash = await bcrypt.hash(password, 10);
      let email = emailPrefix + '@students.vnit.ac.in';

      // SQL query to insert student metadata
      let query1 = `INSERT INTO student (student_id, dept) VALUES ("${studentId}", "${dept.toUpperCase()}");`;
      // using the executeQuery function
      executeQuery(query1, (error, results) => {
        if (error) {
          res.status(500).json(error);
          return;
        }

        let { insertId: rowId } = results;
        // SQL query to insert user data
        let query2 = `INSERT INTO user (email, name, password, details, type) VALUES ("${email}", "${name}", "${passwordHash}", "${rowId}", "student");`;
        // using the executeQuery function
        executeQuery(query2, (error, results) => {
          if (error) {
            res.status(500).json(error);
            return;
          }
        });
      });

      // send the results as JSON
      res.json({ 'status': 'success' });
      console.log(`User: ${name} added in user DB`);
    }
  }
}

const addFaculty = async (req, res) => {

  // validate request body
  const requiredFields = ['token', 'otp'];
  if (validateRequest(req, res, requiredFields)) {

    let user = otpGen.checkOtp(req, res);

    if (user) {
      let query;
      var { facultyId, emailPrefix, dept, name, password } = user;
      let passwordHash = await bcrypt.hash(password, 10);
      let email = emailPrefix + '@' + user.dept + '.vnit.ac.in';

      // SQL query to insert faculty metadata
      query1 = `INSERT INTO faculty (faculty_id, dept) VALUES ("${facultyId}", "${dept.toUpperCase()}");`;
      // using the executeQuery function
      executeQuery(query1, (error, results) => {
        if (error) {
          res.status(500).json(error);
          return;
        }

        let { insertId: rowId } = results;
        // SQL query to insert user data
        let query2 = `INSERT INTO user (email, name, password, details, type) VALUES ("${email}", "${name}", "${passwordHash}", "${rowId}", "faculty");`;
        // using the executeQuery function
        executeQuery(query2, (error, results) => {
          if (error) {
            res.status(500).json(error);
            return;
          }
        });
      });

      // send the results as JSON
      res.json({ 'status': 'success' });
      console.log(`User: ${name} added in faculty DB`);
    }
  }
}

const loginUser = async (req, res) => {
  // validate request body
  const requiredFields = ['email', 'password'];
  if (validateRequest(req, res, requiredFields)) {

    let email = req.body.email;

    // SQL query to find student
    let query = `SELECT * FROM user WHERE email = '${email}' LIMIT 1`;
    // using the executeQuery function
    executeQuery(query, async (error, results) => {
      if (error) {
        res.status(500).json(error);
        return;
      }

      if (results.length === 0 || !results[0]) {
        res.send({ 'status': 'failed' });
        return;
      }

      // append the response with the extracted information
      const { id, email, name, type } = results[0];
      let userResponse = {
        id,
        email,
        name,
        type
      };

      let passwordHash = results[0].password;
      let password = req.body.password;

      bcrypt.compare(password, passwordHash, (err, result) => {
        if (err) {
          res.status(500).json(error);
          console.error(err);
          return;
        } else if (result) {
          // passwords match
          userResponse.status = 'success';
          generateJwt(userResponse, res);
          return;
        } else {
          // passwords do not match
          res.send({ 'status': 'failed' });
          return;
        }
      });
    });
  }
}

const searchUser = async (req, res) => {

  // validate request query params
  const requiredParams = ['string'];

  if (validateQueryParams(req, res, requiredParams)) {

    let searchString = req.query.string;

    // use a regular expression to reject cases like 'string' or "string"
    const pattern = /^['"][^'"]*['"]$/;

    if (!searchString) {
      res.status(400).send({ message: "search string should be present in the request" });
      return;
    } else if (pattern.test(searchString)) {
      res.status(400).send({ message: "do not enclose the string in quotes" });
    } else {

      // SQL query to find student
      let query = `SELECT id, name, avatar FROM user WHERE name LIKE "${searchString}%" LIMIT 5`;
      // using the executeQuery function
      executeQuery(query, async (error, results) => {
        if (error) {
          res.status(500).json(error);
          return;
        }

        // Mapping the results to a simplified JSON format
        const users = results.map(user => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar
        }));

        res.status(200).json(users);
      })
    }
  }
}

// export the controller function for use in Express routes
module.exports = {
  verifyStudent, addStudent,
  verifyFaculty, addFaculty,
  loginUser, searchUser
};