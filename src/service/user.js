const db = require('../database/db/user');
const countDB = require('../database/db/count');
const common = require('../utills/utils');
const Status = common.Status;
const htmlTemplate = require('../utills/htmlTemplate');
const smtp = require('../service/smtp');
let phoneValidation = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
let emailValidation = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


exports.createUser = async (req, res) =>
{
    try
    {
        let userName = req.body.userName ? req.body.userName : null;
        let email = req.body.emailInfo ? req.body.emailInfo.toLowerCase() : null;
        let phone = req.body.phone ? req.body.phone : null;
        let password = req.body.pass ? req.body.pass : null;
        let dob = req.body.dob ? req.body.dob : null;
        let country = req.body.country ? req.body.country : null;
        let state = req.body.state ? req.body.state : null;
        let gender = req.body.gender ? req.body.gender : null;

        if (!email)
        {
            req.flash('error', 'Email is required.');
        
            res.redirect('/register');

            return "";
        }
        else if (email && !(email.match(emailValidation)))
        {
            req.flash('error', 'Invalid email address');

            res.redirect('/register');

            return "";
        }
        else if (email && email.toString().length > 50)
        {
            req.flash('error', 'Email maximum character limit is 50.');

            res.redirect('/register');

            return "";
        }

        if (!password)
        {
            req.flash('error', 'Password is required.');
        
            res.redirect('/register');

            return "";
        }
        else if (password && password.toString().length > 15)
        {
            req.flash('error', 'Password maximum character limit is 15.');

            res.redirect('/register');

            return "";
        }

        if (!dob)
        {
            req.flash('error', 'Password is required.');
        
            res.redirect('/register');

            return "";
        }

        if (!country)
        {
            req.flash('error', 'country is required.');
        
            res.redirect('/register');

            return "";
        }
        else if (country && country.toString().length > 30)
        {
            req.flash('error', 'country maximum character limit is 30.');

            res.redirect('/register');

            return "";
        }

        if (!state)
        {
            req.flash('error', 'state is required.');
        
            res.redirect('/register');

            return "";
        }
        else if (state && state.toString().length > 30)
        {
            req.flash('error', 'state maximum character limit is 30.');

            res.redirect('/register');

            return "";
        }

        if (!gender)
        {
            req.flash('error', 'gender is required.');
        
            res.redirect('/register');

            return "";
        }

        if (!phone)
        {
            req.flash('error', 'phone is required.');
        
            res.redirect('/register');

            return "";
        }
        else if (phone && !(phone.match(phoneValidation)))
        {
            req.flash('error', 'Invalid phone number');

            res.redirect('/register');

            return "";
        }

        if (!userName)
        {
            req.flash('error', 'userName is required.');
        
            res.redirect('/register');

            return "";
        }
        if(userName.toString().length < 2 )
        {
            req.flash('error', 'userName minimum character limit is 2.');

            res.redirect('/register');

            return "";
        }
        else if (userName && userName.toString().length > 30)
        {
            req.flash('error', 'userName maximum character limit is 30.');

            res.redirect('/register');

            return "";
        }

        let existingUserDetails = await db.getExsitingUserDetails(email, phone);

        if (existingUserDetails) 
        {
            if (existingUserDetails.email == email) 
            {
                req.flash('error', 'User email already exists. Try with different email.');

                res.redirect('/register');

                return "";
            }
            else if (existingUserDetails.phone == phone) 
            {
                req.flash('error', 'Phone number already exists.');

                res.redirect('/register');

                return "";
            }
        }

        let uuid = common.generateUUID();

        let params = {
            userName: userName,
            password: password,
            uuid: uuid,
            email: email,
            phone: phone,
            dob: dob,
            country: country,
            state: state,
            gender: gender,
            role: 'USER',
            createdAt: new Date(),
            createdBy: uuid
        }

        let user = await db.createUser(params);

        try
        {
            var htmlData = {
                name: user.userName ? user.userName : '',
                id: user.id ? user.id : null
            };

            let emailSubject = `${user.userName} you are invited to SaiKotiOnline`;
            let emailBody = htmlTemplate.generateUserInvitation(htmlData);

            let userEmailParams = {
                email: user.email,
                subject: emailSubject,
                message: emailBody,
            };

            let x = await smtp.sendEmail(userEmailParams);

        }
        catch (error)
        {
            req.flash('error', error.message);

            res.redirect('/register');

            return "";
        }

        res.redirect('/active-account');
    }
    catch (error) 
    {
        req.flash('error', error.message);

        res.redirect('/register');

        return "";
    }
}

exports.InviteUser = async (req, res) =>
{   
    try
    {
        let userId = req.params.id ? req.params.id : null;

        if (!userId)
        {
            req.flash('error', 'User id is requried.');

            res.redirect('/active-account');

            return "";
        }

        let userDetails = await db.getUserDetailsById(userId);

        if (!userDetails)
        {
            req.flash('error', 'User not found.');

            res.redirect('/active-account');

            return "";
        }

        let params = {
            isRegistered: 1,
            isInvited: 1,
            inviteOn: new Date(),
            updatedAt: new Date(),
            updatedBy: userDetails.uuid
        }

        let updateUser = await db.updateUser(userId, params);

        res.redirect('/login');
    }
    catch (error) 
    {
        req.flash('error', error.message);

        res.redirect('/login');

        return "";
    }
}

exports.reSendInviteUser = async (req, res) =>
{
    try
    {
        let email = req.body.email ? req.body.email : null;

        if (!email)
        {
            req.flash('error', 'Email is required.');

            res.redirect('/active-account');

            return "";
        }

        let userDetails = await db.getUserByEmailId(email);

        if (!userDetails)
        {
            req.flash('error', 'There is no user with such email.');

            res.redirect('/active-account');

            return "";
        }

        var htmlData = {
            name: userDetails.userName ? userDetails.userName : '',
            id: userDetails.id ? userDetails.id : null
        };

        let emailSubject = `${userDetails.userName} you are invited to SaiKotiOnline`;
        let emailBody = htmlTemplate.generateUserInvitation(htmlData);

        let userEmailParams = {
            email: userDetails.email,
            subject: emailSubject,
            message: emailBody,
        };

        let x = await smtp.sendEmail(userEmailParams);

        req.flash('success', 'Invitation email is sent to your email address');

        res.redirect('/active-account');

        return "";
    }
    catch (error)
    {
        req.flash('error', error);

        res.redirect('/active-account');

        return "";
    }
}

exports.userLogin = async (req, res) =>
{
    try 
    {
        let email  = req.body.emailInfo ? req.body.emailInfo : null;
        let password = req.body.pass ? req.body.pass: null;

        if (!email)
        {
            req.flash('error', 'Email is required.');
        
            res.redirect('/login');

            return "";
        }
        else if (email && !(email.match(emailValidation)))
        {
            req.flash('error', 'Invalid email address');

            res.redirect('/login');

            return "";
        }
        else if (email && email.length > 50)
        {
            req.flash('error', 'Email maximum character limit is 50.');

            res.redirect('/login');

            return "";
        }

        if (!password)
        {
            req.flash('error', 'password is required.');

            res.redirect('/login');

            return "";
        }

        let user = await db.getUserLoginDetails(email, password);

        if (!user) 
        {
            req.flash('error', 'Username or password is incorrect.');

            res.redirect('/login');

            return "";
        }

        if (user.isRegistered == 0 || user.isInvited == 0 || user.inviteOn == null) 
        {
            req.flash('error', 'User login failed. Try to activate your account');

            res.redirect('/active-account');

            return "";
        }

        let countDetails = await countDB.getCounts(user.uuid);

        req.session.isLoggedIn = true;
        req.session.name = user.userName;
        req.session.userId = user.id;
        req.session.uuid =  user.uuid;
        req.session.count = countDetails && countDetails.noOfCount ? countDetails.noOfCount : 0;
        req.session.save();

        res.redirect('/dashboard');
       
    }
    catch (error) 
    {
        req.flash('error', error);

        res.redirect('/login');

        return "";
    }
}

exports.resetPassword = async (req, res) =>
{
    try 
    {
        let email = req.body.email ? req.body.email : null;

        if (!email)
        {
            req.flash('error', 'Email is requried.');

            res.redirect('/reset-password');

            return "";
        }

        let user = await db.getUserByEmailId(email);

        if (!user)
         {
            req.flash('error', 'There is no user with such email.');

            res.redirect('/reset-password');

            return "";
        }

        try
        {
            var htmlData = {
                name: user.userName ? user.userName : '',
                id: user.id ? user.id : null,
                email: user.email
            };

            let emailSubject = `Password reset for Saikoti`;
            let emailBody = htmlTemplate.generateResetPassword(htmlData);

            let userEmailParams = {
                email: user.email,
                subject: emailSubject,
                message: emailBody,
            };

            let x = await smtp.sendEmail(userEmailParams);

        }
        catch (error)
        {
            req.flash('error', error.message);

            res.redirect('/reset-password');

            return "";
        }

        req.flash('success', 'Reset password email is sent to your email address');

        res.redirect('/reset-password');

        return "";
    } 
    catch (error) 
    {
        req.flash('error', error.message);

        res.redirect('/reset-password');

        return "";
    }
}

exports.changePassword = async (req, res) =>
{
    try 
    {
        let email = req.body.email ? req.body.email : null;

        let password = req.body.pass ? req.body.pass : null;

        if (!email)
        {
            req.flash('error', 'Email is requried.');

            res.redirect('/change-password');

            return "";
        }

        if (!password)
        {
            req.flash('error', 'Password is requried.');

            res.redirect('/change-password');

            return "";
        }

        let user = await db.getUserByEmailId(email);

        if (!user)
         {
            req.flash('error', 'There is no user with such email.');

            res.redirect('/change-password');

            return "";
        }

        if (user.isRegistered == 0 || user.isInvited == 0 || user.inviteOn == null) 
        {
            req.flash('error', 'User login failed. Try to activate your account');

            res.redirect('/change-password');

            return "";
        }

        let params = {
            password : req.body.pass,
            updatedAt : new Date(),
            updatedBy: user.uuid
        }

        let updateUser = db.updateUser(user.id, params);

        req.flash('success', 'Password was changed successfuly.');

        res.redirect('/login');

        return "";
    } 
    catch (error) 
    {
        req.flash('error', error.message);

        res.redirect('/change/password');

        return "";
    }
}


exports.addCount = async (reqParams) =>
{
    try
    {
        let uuid = reqParams.uuid ? reqParams.uuid : null;

        if (!uuid)
        {
            req.flash('error', 'params are required.');

            res.redirect('/dashboardInfo');

            return "";
        }

        let getCount = await countDB.getCounts(uuid);

        let id = getCount && getCount.id ? getCount.id : null;

        if(!getCount)
        {
            let params = {
                page: 1,
                noOfCount: 1,
                uuid: uuid,
                createdAt: new Date(),
                createdBy: uuid
            }

            let addCountInfo = await countDB.addCount(params);
            
            return {
                status : Status.SUCCESS,
                data : {
                    count : addCountInfo
                }
            }
        }
        else
        {
            let params = {
                noOfCount: Number(Number(getCount.noOfCount)) + 1,
                page : reqParams.page,
                uuid: uuid,
                updatedAt: new Date(),
                updatedBy: uuid
            }

            let updateCount = await countDB.updateCount(id, params);

            return {
                status : Status.SUCCESS,
                data : {
                    count : updateCount
                }
            }
        }
    }
    catch (error) 
    {
        return {
            status: Status.FAIL,
            message: error.message
        }
    }
}

exports.getCount = async (reqParams) =>
{
    try
    {
        let uuid = reqParams.uuid ? reqParams.uuid : null;

        if (!uuid)
        {
            req.flash('error', 'params are required.');

            res.redirect('/dashboardInfo');
        }

        let getCount = await countDB.getCounts(uuid);

        return {
            status: Status.SUCCESS,
            count: getCount
        }

    }
    catch (error) 
    {
        return {
            status: Status.FAIL,
            message: error.message
        }
    }
}

exports.getUserById = async (reqParams) =>
{
    try
    {
        let userId = reqParams.id ? reqParams.id : null;

        console.log('id',userId)

        if (!userId)
        {
            req.flash('error', 'user id is required.');

            res.redirect('/myAccount');
        }

        let userDetails = await db.getUserDetailsById(userId);

        return {
            status: Status.SUCCESS,
            userDetails: userDetails
        }
    }
    catch (error) 
    {
        console.log(error)
        return {
            status: Status.FAIL,
            message: error.message
        }
    }
}

exports.updateUser = async (req, res) =>
{
    try
    {
        let userName = req.body.userName ? req.body.userName : null;
        let email = req.body.emailInfo ? req.body.emailInfo.toLowerCase() : null;
        let phone = req.body.phone ? req.body.phone : null;
        let dob = req.body.dob ? req.body.dob : null;
        let country = req.body.country ? req.body.country : null;
        let state = req.body.state ? req.body.state : null;
        let gender = req.body.gender ? req.body.gender : null;
        let uuid = req.body.uuid ? req.body.uuid : null;
        let id = req.body.userId ? req.body.userId : null;


        if (!email)
        {
            req.flash('error', 'Email is required.');
        
            res.redirect('/myAccount');

            return "";
        }
        else if (email && !(email.match(emailValidation)))
        {
            req.flash('error', 'Invalid email address');

            res.redirect('/myAccount');

            return "";
        }
        else if (email && email.toString().length > 50)
        {
            req.flash('error', 'Email maximum character limit is 50.');

            res.redirect('/myAccount');

            return "";
        }

        if (!dob)
        {
            req.flash('error', 'Password is required.');
        
            res.redirect('/myAccount');

            return "";
        }

        if (!country)
        {
            req.flash('error', 'country is required.');
        
            res.redirect('/myAccount');

            return "";
        }
        else if (country && country.toString().length > 30)
        {
            req.flash('error', 'country maximum character limit is 30.');

            res.redirect('/myAccount');

            return "";
        }

        if (!state)
        {
            req.flash('error', 'state is required.');
        
            res.redirect('/myAccount');

            return "";
        }
        else if (state && state.toString().length > 30)
        {
            req.flash('error', 'state maximum character limit is 30.');

            res.redirect('/myAccount');

            return "";
        }

        if (!gender)
        {
            req.flash('error', 'gender is required.');
        
            res.redirect('/myAccount');

            return "";
        }

        if (!phone)
        {
            req.flash('error', 'phone is required.');
        
            res.redirect('/myAccount');

            return "";
        }
        else if (phone && !(phone.match(phoneValidation)))
        {
            req.flash('error', 'Invalid phone number');

            res.redirect('/myAccount');

            return "";
        }

        if (!userName)
        {
            req.flash('error', 'userName is required.');
        
            res.redirect('/myAccount');

            return "";
        }
        if(userName.toString().length < 2 )
        {
            req.flash('error', 'userName minimum character limit is 2.');

            res.redirect('/myAccount');

            return "";
        }
        else if (userName && userName.toString().length > 30)
        {
            req.flash('error', 'userName maximum character limit is 30.');

            res.redirect('/myAccount');

            return "";
        }

        let params = {
            userName: userName,
            email: email,
            phone: phone,
            dob: dob,
            country: country,
            state: state,
            gender: gender,
            role: 'USER',
            updatedAt: new Date(),
            updatedBy: uuid
        }

        await db.updateUser(id, params);

        req.flash('success', 'Profile updated successfully');
        
        res.redirect('/myAccount');
    }
    catch (error) 
    {
        req.flash('error', error.message);

        res.redirect('/myAccount');

        return "";
    }
}