const {  body, check, validationResult } = require("express-validator");

exports.validateTxn = function() {
 console.log("okk");
     return [ 
        check('buyerFirstName', 'Your email is not valid').not().isEmpty().isEmail(),
       ] ;  
};

exports.runValidation =  function(req, res, next) {
    const myValidationResult = validationResult.withDefaults({
      formatter: error => {
        return  error.msg;
      },
    });
    const errors = myValidationResult(req).mapped();
    if(Object.entries(errors).length === 0){   
      next();
    }
    else {
        console.log(errors);
        res.render('txn', { 
            title: 'Express',
            errors: errors,
            fdata: req.body
        });
    }
}
