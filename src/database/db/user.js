const User = require('../../database/model/user');

let getExsitingUserDetails = async (email, phone) =>
{
  return await User.query().select().where('email', email).orWhere('phone', phone).first();
}

let createUser = async(data) =>
{
    return await User.query().insert(data);
}

let getUserDetails = async (id) =>
{
  return await User.query().select().where('id', id).first();
}

let updateUser = async (id, data) =>
{
    return await User.query().patchAndFetchById(id, data);
}

let getUserLoginDetails = async (email, password) => 
{
  return await User.query().select().where({
    email: email,
    password: password
  })
}

module.exports = {
  getExsitingUserDetails : getExsitingUserDetails,
  createUser: createUser,
  getUserDetails: getUserDetails,
  updateUser: updateUser,
  getUserLoginDetails : getUserLoginDetails

}