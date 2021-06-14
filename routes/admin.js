
var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const verifyLogin = (req, res, next)=>{
  if(req.session.adminLoggedIn){
    next()
  }
  else{
    res.redirect('admin/admin-login')
  }
}

/* GET users listing. */
router.get('/',verifyLogin, function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{products});
  })
  
  
});
router.get('/admin-login',(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
  res.render('admin/admin-login',{"loginErr":req.session.adminLoginErr})
  req.session.adminLoginErr = false
}

})
router.post('/admin-login',(req, res)=>{
  productHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.admin = response.admin
      req.session.adminLoggedIn = true
      res.redirect('/admin')
    }else{
      req.session.adminLoginErr = "Invalid admin"
      res.redirect('/admin/admin-login')
    }
  })  

})



router.get('/add-product', function( req, res){
  res.render('admin/add-product')
})
router.post("/add-product", function(req, res)
{
    productHelpers.addProduct(req.body,(id)=>{
      let image = req.files.Image
      console.log(id)
      image.mv('./public/product-images/'+id+'.jpg',(err)=>{
        if(!err){
          res.render("admin/add-product")
        }else{
          console.log(err)
        }
    })
   })
  


});
router.get('/delete-product/', (req, res)=>{
  let proId = req.query.id
  console.log(proId);
  productHelpers.deleteProducts(proId).then((response)=>{
    res.redirect('/admin/')
  })

})
router.get('/edit-product/:id',async(req,res)=>{
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id',(req, res)=>{
  productHelpers.updateProduct(req.params.id, req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let id = req.params.id
      let image = req.files.Image
      image.mv('./public/product-images/'+id+'.jpg')

    }
  })
})

module.exports = router;
