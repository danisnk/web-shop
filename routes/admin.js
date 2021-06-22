
var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const fs = require('fs')
const { nanoid } = require('nanoid')
const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  }
  else {
    res.redirect('admin/admin-login')
  }
}

/* GET users listing. */
router.get('/', verifyLogin, function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { products });
  })


});
router.get('/admin-login', (req, res) => {
  if (req.session.admin) {
    res.redirect('/admin')
  } else {
    res.render('admin/admin-login', { "loginErr": req.session.adminLoginErr })
    req.session.adminLoginErr = false
  }

})
router.post('/admin-login', (req, res) => {
  productHelpers.doLogin(req.body).then((response) => {
    if (response.status) {

      req.session.admin = response.admin
      req.session.adminLoggedIn = true
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = "Invalid admin"
      res.redirect('/admin/admin-login')
    }
  })

})



router.get('/add-product', function (req, res) {
  res.render('admin/add-product')
})
router.post("/add-product", function (req, res) {
  productHelpers.addProduct(req.body, (proId) => {

    if (req.files) {

      const file = req.files.image;
      var productImages = {
        product: proId,
        productImageUrls: []
      }

      for (let i = 0; i < file.length; i++) {

        var random = nanoid();
        url = "/product-images/" + random + ".jpg";
        productImages.productImageUrls.push(url)
        file[1].mv("./public/product-images/" + proId + ".jpg")
        file[i].mv("./public" + url, function (err) {

          if (err) {

            res.send(err);

          }
        })

      }
      productHelpers.addImage(productImages)
      res.send('files uploaded');

    }
  })



});
router.get('/delete-product/:id', async (req, res) => {
  let proId = req.params.id
  let productImage = await productHelpers.getProductImage(proId)
  let files = productImage['productImageUrls']
  productHelpers.deleteProducts(proId).then((response) => {
    if (response) {
      
      try {
        files.forEach(path => fs.existsSync('./public'+ path) && fs.unlinkSync('./public'+ path))
        fs.unlink('./public/product-images/'+proId+'.jpg', function(){
          res.redirect('/admin')

        }
        
        )} catch (err) {
        // error handling here
        console.error(err)
      }

    }

  })

})
router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product', { product })
})
router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin')
    if (req.files.Image) {
      let id = req.params.id
      let image = req.files.Image
      image.mv('./public/product-images/' + id + '.jpg')

    }
  })
})

module.exports = router;
