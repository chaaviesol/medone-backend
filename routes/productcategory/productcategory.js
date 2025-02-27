const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");
require("dotenv").config();

/////////////////productcategoryy///////////////////////
const addcategory = async (request, response) => {
  try {
    let { id, category } = JSON.parse(request.body.data);
    const imageLink = request.file?.location;
    const datetime = getCurrentDateInIST();
    category = category?.trim().replace(/\s+/g, " ");

    // Validate the required fields
    if (!category) {
      return response.status(400).json({
        error: true,
        message: "Category can't be null or empty.",
      });
    }

    const upr_category = category.toUpperCase();
    if (id) {
      const check = await prisma.productcategory.findUnique({
        where: {
          id: id,
        },
      });
      console.log({ check });
      if (!check) {
        return response.status(400).json({
          error: true,
          message: "Category not found.",
        });
      }

      if (check.category !== upr_category) {
       
        const checkcategory = await prisma.generic_product.findFirst({
          where: {
            category: {
              array_contains: check.category,
            },
            is_active:"Y"
          },
        });
        console.log({ checkcategory });
        if (checkcategory) {
          return response.status(400).json({
            error: true,
            message:
              "This category can't be updated because products with this category exist.",
          });
        }

        const update = await prisma.productcategory.update({
          where: {
            id: id,
          },
          data: {
            category: upr_category,
            image: imageLink,
            modified_date: datetime,
          },
        });

        if (update) {
          return response.status(200).json({
            success: true,
            error: false,
            message: "Category updated successfully.",
          });
        }
      } else {
        const update = await prisma.productcategory.update({
          where: {
            id: id,
          },
          data: {
            category: upr_category,
            image: imageLink,
            modified_date: datetime,
          },
        });

        if (update) {
          return response.status(200).json({
            success: true,
            error: false,
            message: "Category updated successfully.",
          });
        }
      }
    } else {
      const checkcategory = await prisma.productcategory.findMany({
        where: {
          category: upr_category,
        },
      });

      if (checkcategory.length > 0) {
        return response.status(400).json({
          error: true,
          message: "Category already exists.",
          status: 400,
        });
      }
      const add = await prisma.productcategory.create({
        data: {
          status: true,
          category: upr_category,
          image: imageLink,
          created_date: datetime,
        },
      });

      if (add) {
        return response.status(200).json({
          success: true,
          error: false,
          message: "Category created successfully.",
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in product-addcategory API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const getcategory = async (request, response) => {
  const startTime = Date.now();
  try {
    logger.info("API getcategory called");
    const get = await prisma.productcategory.findMany({
      where: {
        status: true,
      },
      orderBy: {
        category: "asc",
      },
      select: {
        id: true,
        category: true,
        image: true,
      },
    });
    if (get.length > 0) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      logger.info(`Execution time for getcategory API: ${executionTime}ms`);
      return response.status(200).json({
        data: get,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in product-getcategory API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const deletecategory = async (request, response) => {
  console.log("object", request.body);
  try {
    const { id } = request.body;

    if (!id) {
      return response.status(400).json({
        error: true,
        message: "ID can't be null",
      });
    }

    // Check if the category exists
    const check = await prisma.productcategory.findUnique({
      where: {
        id: id,
      },
    });

    if (check) {
      // Check if there are products associated with this category
      const checkcategory = await prisma.generic_product.findFirst({
        where: {
          category: {
            array_contains: check.category,
          },
          is_active:"Y"
        },
      });

      if (checkcategory) {
        return response.status(400).json({
          error: true,
          message:
            "This category can't be deleted because products with this category exist.",
        });
      }

      const update = await prisma.productcategory.delete({
        where: {
          id: id,
        },
      });

      if (update) {
        return response.status(200).json({
          success: true,
          error: false,
          message: "Category deleted successfully.",
        });
      }
    } else {
      return response.status(404).json({
        error: true,
        message: "Category not found.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in product-deletecategory API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const getcategorywise = async (request, response) => {
  try {
    const categories = await prisma.productcategory.findMany({
      select: { id: true, category: true, image: true },
    });

    if (categories.length > 0) {
      let resultObject = [];
      const normalizeString = (str) =>
        str.toLowerCase().trim().replace(/\s+/g, " ");

      for (let i = 0; i < categories.length; i++) {
        const normalizedCategory = normalizeString(categories[i].category);

        const products = await prisma.generic_product.findMany();
        const matchingProducts = products
          .filter((product) => {
            return product.category.some(
              (cat) => normalizeString(cat) === normalizedCategory
            );
          })
          .map((product) => {
            // const sellingPrice =
            //   product.selling_price !== null
            //     ? product.selling_price
            //     : parseInt(product.mrp) - parseInt(product.mrp) * 0.1;
            return {
              ...product,
              quantity: 0,
              // selling_price: sellingPrice, // Send calculated selling_price
            };
          });

        resultObject.push({
          id: categories[i].id,
          categoryName: categories[i].category,
          categoryImage: categories[i].image,
          products: matchingProducts,
        });
      }

      response.status(200).json({
        success: true,
        data: resultObject,
      });
    } else {
      response.status(200).json({ message: "No Data" });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in product-getcategory API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

///getcategory for mobile app

const getcategorywise_app = async (request, response) => {
  const user_Id  = request.body.userId;
  // const user_Id = request.user.userId;
  try {
    const categories = await prisma.productcategory.findMany({
      select: { id: true, category: true, image: true },
    });

    if (categories.length > 0) {
      let resultObject = [];
      const normalizeString = (str) =>
        str.toLowerCase().trim().replace(/\s+/g, " ");

      // Fetch all products in the user's cart with their quantities
      const findProductsInCart = await prisma.customer_cart.findMany({
        where: { user_id: user_Id },
        select: { prod_id: true, quantity: true },
      });

      // Convert cart product data into a Map for quick lookup
      const cartProductMap = new Map(
        findProductsInCart.map((item) => [item.prod_id, item.quantity])
      );

      for (let i = 0; i < categories.length; i++) {
        const normalizedCategory = normalizeString(categories[i].category);

        // Fetch all generic products
        const products = await prisma.generic_product.findMany();

        // Match products by category and determine if they are in the cart
        const matchingProducts = products
          .filter((product) => {
            return product.category.some(
              (cat) => normalizeString(cat) === normalizedCategory
            );
          })
          .map((product) => {
            const sellingPrice =
              product.selling_price !== null
                ? product.selling_price
                : parseInt(product.mrp) - parseInt(product.mrp) * 0.1;

            return {
              ...product,
              quantity: cartProductMap.get(product.id) || 0, // Set quantity from the cart or default to 0
              inCart: cartProductMap.has(product.id), // Check if product is in the cart
              selling_price: sellingPrice,
            };
          });

        resultObject.push({
          id: categories[i].id,
          categoryName: categories[i].category,
          categoryImage: categories[i].image,
          products: matchingProducts,
        });
      }

      response.status(200).json({
        success: true,
        data: resultObject,
      });
    } else {
      response.status(200).json({ message: "No Data" });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in product-getcategory API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

module.exports = {
  addcategory,
  getcategory,
  deletecategory,
  getcategorywise,
  getcategorywise_app,
};
