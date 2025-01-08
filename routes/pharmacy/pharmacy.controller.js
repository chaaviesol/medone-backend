const {
  decrypt,
  getCurrentDateInIST,
  istDate,
  logger,
  prisma,
} = require("../../utils");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const pharmacyadd = async (request, response) => {
  const datetime = getCurrentDateInIST();

  try {
    const { name, phone_no, address, lisence_no, email, pincode } =
      request.body;

    // Check if required fields are present
    if (!name || !phone_no || !address || !email || !pincode) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }

    // Check if email already exists
    const checkEmail = await prisma.pharmacy_details.findFirst({
      where: { email },
    });

    // Check if phone number already exists
    const checkPhoneNumber = await prisma.pharmacy_details.findFirst({
      where: { phone_no },
    });

    if (checkEmail) {
      return response.status(400).json({
        message: "Email ID already exists",
        error: true,
      });
    }

    if (checkPhoneNumber) {
      return response.status(400).json({
        message: "Phone number already exists",
        error: true,
      });
    }

    // Create a new pharmacy record
    const create = await prisma.pharmacy_details.create({
      data: {
        name,
        phone_no,
        address,
        lisence_no,
        email,
        pincode,
        datetime: datetime,
      },
    });

    if (create) {
      return response.status(200).json({
        message: "Successfully created",
        error: false,
        success: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in pharmacyadd API`);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    //await prisma.$disconnect();
  }
};

const getpharmacy = async (request, response) => {
  try {
    const getall = await prisma.pharmacy_details.findMany();
    if (getall.length > 0) {
      return response.status(200).json({
        data: getall,
        success: true,
      });
    } else {
      return response.status(400).json({
        message: "No Data",
        error: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in getpharmacy API`);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    //await prisma.$disconnect();
  }
};

//get pharmacy based on pincode//////////
const filterpharmacy = async (request, response) => {
  try {
    const { selectedArea_id } = request.body;

    const get_postalData = await prisma.pincode_data.findMany({
      where: { id: selectedArea_id },
    });

    if (!get_postalData.length) {
      return response.status(404).json({
        message: "Area not found",
        error: true,
      });
    }

    const result = get_postalData[0].pincode;
    let get_pharmacyDetails = await prisma.pharmacy_details.findMany({
      where: { pincode: result },
    });

    if (get_pharmacyDetails.length === 0) {
      const suggestedPincodes = Array.from({ length: 4 }, (_, i) => [
        result + i + 1,
        result - i - 1,
      ]).flat();

      let nearByData_featured = [];
      let foundPharmacies = false;

      for (const pincode of suggestedPincodes) {
        const nearByPharmacies = await prisma.pharmacy_details.findMany({
          where: { pincode },
        });

        if (nearByPharmacies.length > 0) {
          const featuredPharmacies = nearByPharmacies.filter(
            (pharmacy) => pharmacy.featured_partner
          );
          const nonFeaturedPharmacies = nearByPharmacies.filter(
            (pharmacy) => !pharmacy.featured_partner
          );

          nearByData_featured = [
            ...nearByData_featured,
            ...featuredPharmacies,
            ...nonFeaturedPharmacies,
          ];

          if (nearByData_featured.length > 0) {
            foundPharmacies = true;
            break;
          }
        }
      }

      if (!foundPharmacies) {
        return response.status(404).json({
          error: true,
          success: false,
          message: "No data found",
        });
      }

      return response.status(200).json({
        error: false,
        success: true,
        message: "Success",
        data: nearByData_featured,
      });
    }

    response.status(200).json({
      error: false,
      success: true,
      message: "Success",
      data: get_pharmacyDetails,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in filterpharmacy API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    //await prisma.$disconnect();
  }
};

////////////from productadd to salesorder /////////////

const productadd = async (request, response) => {
  const datetime = getCurrentDateInIST();
  try {
    const {
      id,
      name,
      description,
      category,
      created_by,
      mrp,
      brand,
      images,
      hsn,
      prescription_required,
      composition,
      product_type,
    } = JSON.parse(request.body.data);
    if (!name || !description || !mrp || !brand) {
      return response.status(400).json({ error: "All fields are required" });
    }
    if (category.length < 0) {
      return response.status(400).json({ error: "Category can't be null" });
    }

    if (id) {
      const product_images = request.files;
      let index = 0;
      let productImage = {};

      for (let i = 0; i < images.length; i++) {
        let keyName = `image${i + 1}`;

        if (images[i].file) {
          productImage[keyName] = product_images[index].location;
          index = index + 1;
        } else {
          productImage[keyName] = images[i];
        }
      }

      const create = await prisma.generic_product.update({
        where: {
          id: id,
        },
        data: {
          name,
          description,
          category,
          created_by,
          images: productImage,
          mrp: parseInt(mrp),
          brand,
          created_date: datetime,
          is_active: "Y",
          hsn: hsn,
          product_type,
          prescription_required,
          composition,
        },
      });
      if (create) {
        return response.status(200).json({
          message: "Successfully updated",
          success: true,
        });
      }
    } else {
      const product_images = request.files;

      let productImage = {};

      for (i = 0; i < product_images?.length; i++) {
        let keyName = `image${i + 1}`;
        productImage[keyName] = product_images[i]?.location;
      }

      const create = await prisma.generic_product.create({
        data: {
          name,
          description,
          category,
          created_by,
          images: productImage,
          mrp: parseInt(mrp),
          brand,
          created_date: datetime,
          is_active: "Y",
          hsn: hsn,
          product_type,
          prescription_required,
          composition,
        },
      });
      if (create) {
        return response.status(200).json({
          message: "Successfully created",
          success: true,
        });
      }
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in productadd API`);
    response.status(500).json("An error occurred");
  } finally {
    //await prisma.$disconnect();
  }
};

const disableproduct = async (request, response) => {
  console.log("objecdisssssssst", request.body);
  const datetime = getCurrentDateInIST();
  try {
    const { id } = request.body;
    const allproducts = await prisma.generic_product.update({
      where: {
        id: id,
      },
      data: {
        is_active: "N",
        updated_date: datetime,
      },
    });
    if (allproducts) {
      return response.status(200).json({
        message: "successfully disabled",
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy disableproduct API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const getproducts = async (request, response) => {
  try {
    const allproducts = await prisma.generic_product.findMany({
      where: {
        is_active: "Y",
      },
    });
    if (allproducts.length > 0) {
      return response.status(200).json({
        data: allproducts,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy getproducts API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const addToCart = async (request, response) => {
  const { prod_id, quantity } = request.body;
  const user_id = request.user.userId;
  const datetime = getCurrentDateInIST();
  try {
    if (!user_id || !prod_id || !quantity) {
      logger.error(
        "user_id, prod_id, or quantity is undefined in addToCart API"
      );
      return response.status(400).json({
        error: true,
        message: "user_id, prod_id, and quantity are required fields",
      });
    }

    const existingCartItem = await prisma.customer_cart.findFirst({
      where: {
        user_id: user_id,
        prod_id: prod_id,
      },
    });

    if (existingCartItem) {
      const addexistingitem = await prisma.customer_cart.update({
        where: {
          id: existingCartItem?.id,
          user_id: user_id,
          prod_id: prod_id,
        },
        data: {
          quantity: parseInt(quantity),
        },
      });
      return response.status(200).json({
        error: true,
        message: "Successfully added to cart",
      });
    }

    // Add product to cart
    const data = await prisma.customer_cart.create({
      data: {
        user_id: user_id,
        prod_id: prod_id,
        quantity: parseInt(quantity),
        created_date: datetime,
      },
    });

    if (data) {
      response.status(201).json({
        success: true,
        message: "Successfully added to cart",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy--> addToCart API`
    );

    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const getCart = async (request, response) => {
  const user_id = request.user.userId;

  try {
    if (!user_id) {
      logger.error("user_id is undefined in getCart API");
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }

    const cartItems = await prisma.customer_cart.findMany({
      where: {
        user_id: user_id,
      },
      orderBy: {
        created_date: "desc",
      },
      select: {
        quantity: true,
        generic_prodid: {
          select: {
            name: true,
            id: true,
            images: true,
            mrp: true,
            brand: true,
          },
        },
      },
    });

    const extractedResponse = cartItems.map((item) => ({
      product_name: item.generic_prodid.name,
      product_id: item.generic_prodid.id,
      quantity: item.quantity,
      mrp: item.generic_prodid.mrp,
      images: item.generic_prodid.images,
      brand: item.generic_prodid.brand,
    }));

    response.status(200).json({
      success: true,
      data: extractedResponse,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in getCart API`);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const removeFromCart = async (request, response) => {
  const { prod_id } = request.body;
  const user_id = request.user.userId;
  if (!user_id || !prod_id) {
    logger.error("user_id or prod_id is undefined in removeFromCart API");
    return response.status(400).json({
      error: true,
      message: "user_id and prod_id are required",
    });
  }

  try {
    const result = await prisma.customer_cart.deleteMany({
      where: {
        user_id: user_id,
        prod_id: parseInt(prod_id),
      },
    });

    if (result.count === 0) {
      return response.status(404).json({
        success: false,
        message: "No such product found in cart",
      });
    }

    response.status(200).json({
      success: true,
      message: "Successfully deleted from cart",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in removeFromCart API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};
////////////sales_order////////////

const salesorder = async (request, response) => {
  const usertype = request.user.userType;
  const {
    name, //customername
    total_amount,
    so_status,
    remarks,
    order_type,
    products,
    delivery_address,
    delivery_location,
    city,
    district,
    pincode,
    contact_no,
  } = request.body;

  const userId = parseInt(request.user.userId);
  let sales_order;

  try {
    if (!userId) {
      logger.error("user_id is undefined in salesorder API");
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }
    if (usertype != "customer") {
      return response.status(400).json({
        error: true,
        message: "Please login as a customer",
      });
    }
    if (!delivery_address || !contact_no) {
      return response.status(400).json({
        error: true,
        message: "Missing delivery details",
      });
    }

    if (!order_type) {
      return response.status(400).json({
        error: true,
        message: "Missing order_type field",
      });
    }
    let location;
    if (order_type != "prescription") {
      location = delivery_location;
    } else {
      location = JSON.parse(delivery_location);
    }

    await prisma.$transaction(async (prisma) => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();

      const lastTwoDigits = year.toString().slice(-2);
      const so_num = "SO";
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1);
      const existingsalesOrders = await prisma.sales_order.findMany({
        where: {
          created_date: {
            gte: startOfYear,
            lt: endOfYear,
          },
        },
      });
      const newid = existingsalesOrders.length + 1;
      const formattedNewId = ("0000" + newid).slice(-4);
      const so_number = so_num + lastTwoDigits + formattedNewId;
      let total_amount_fixed;

      if (total_amount) {
        total_amount_fixed = parseFloat(total_amount).toFixed(2);
      }

      const datetime = getCurrentDateInIST();

      sales_order = await prisma.sales_order.create({
        data: {
          so_number: so_number,
          total_amount: total_amount_fixed,
          so_status: "placed",
          remarks,
          order_type,
          patient_name: name,
          created_date: datetime,
          customer_id: userId,
          delivery_address: delivery_address,
          delivery_location: location,
          city,
          district,
          contact_no: contact_no.toString(),
          pincode: parseInt(pincode),
        },
      });

      if (order_type != "prescription") {
        for (let product of products) {
          const net_amount = parseInt(product.quantity) * parseInt(product.mrp);

          await prisma.sales_list.create({
            data: {
              sales_order: {
                connect: {
                  sales_id: sales_order.sales_id,
                },
              },
              generic_prodid: {
                connect: {
                  id: product.product_id,
                },
              },
              order_qty: parseInt(product.quantity),
              net_amount: net_amount,
              created_date: datetime,
            },
          });
        }

        await prisma.customer_cart.deleteMany({
          where: {
            user_id: userId,
          },
        });

        return response.status(200).json({
          success: true,
          message: "Successfully placed your order",
        });
      } else if (order_type === "prescription") {
        const prescription_image = request.files;
        let imageprescription = {};

        if (!prescription_image || prescription_image.length === 0) {
          return response.status(400).json({
            message: "Please attach at least one report",
            error: true,
          });
        }

        for (i = 0; i < prescription_image?.length; i++) {
          let keyName = `image${i + 1}`;
          imageprescription[keyName] = prescription_image[i].location;
        }

        await prisma.sales_order.update({
          where: {
            sales_id: sales_order.sales_id,
          },
          data: {
            prescription_image: imageprescription,
            created_date: datetime,
          },
        });

        response.status(200).json({
          success: true,
          message: "Prescription submitted.",
        });
      }
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in salesorder API`);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

/////////////new salesorder with prescription and prescription order

const getasalesorder = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const sales_id = request.body.sales_id;
    if (!sales_id) {
      return response.status(400).json({
        message: "sales_id can't be null",
        error: true,
      });
    }
    const getdata = await prisma.sales_order.findUnique({
      where: {
        sales_id: sales_id,
      },
      select: {
        sales_id: true,
        so_number: true,
        so_status: true,
        order_type: true,
        remarks: true,
        users: {
          select: {
            name: true,
          },
        },
        contact_no: true,
        created_date: true,
        delivery_address: true,
        city: true,
        district: true,
        pincode: true,
        prescription_image: true,
        patient_name: true,
        sales_list: {
          select: {
            id: true,
            order_qty: true,
            net_amount: true,
            pharmacy_name: true,
            generic_prodid: {
              select: {
                name: true,
                category: true,
                mrp: true,
                description: true,
              },
            },
          },
        },
      },
    });
    const decryptedUsername = decrypt(getdata?.users.name, secretKey);
    getdata.users = decryptedUsername;
    response.status(200).json({
      success: true,
      data: getdata,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in salesorder API`);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const presciptionsaleorders = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const all = await prisma.sales_order.findMany({
      where: {
        order_type: "prescription",
        // prescription_data: {
        //   some: {},
        // },
      },
      select: {
        sales_id: true,
        so_status: true,
        created_date: true,
        contact_no: true,
        pincode: true,
        so_number: true,
        delivery_address: true,
        city: true,
        district: true,
        order_type: true,
        remarks: true,
        users: {
          select: {
            name: true,
          },
        },
        prescription_image: true,
        patient_name: true,
      },
      orderBy: {
        created_date: "desc",
      },
    });

    if (all.length > 0) {
      let requested = [];
      let others = [];
      let ofd = [];
      let packed = [];
      let delivered = [];
      all.forEach((order) => {
        if (order?.users?.name) {
          const decryptedUsername = decrypt(order.users.name, secretKey);
          order.users = decryptedUsername;
        }
        if (order.so_status === "Placed" || order.so_status === "placed") {
          requested.push(order);
        } else if (order.so_status === "packed") {
          packed.push(order);
        } else if (order.so_status === "Out for Delivery") {
          ofd.push(order);
        } else if (order.so_status === "delivered") {
          delivered.push(order);
        } else {
          others.push(order);
        }
      });

      return response.status(200).json({
        success: true,
        data: all,
        requestlength: requested.length,
        packedlength: packed.length,
        outfordelivery: ofd.length,
        deliveredlength: delivered.length,
        otherslength: others.length,
      });
    } else {
      return response.status(404).json({
        success: false,
        message: "No prescription sale orders found.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in presciptionsaleorders API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const allsalelistorders = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const all = await prisma.sales_order.findMany({
      where: {
        order_type: "salesorder",
      },
      select: {
        sales_id: true,
        so_status: true,
        created_date: true,
        contact_no: true,
        pincode: true,
        so_number: true,
        delivery_address: true,
        city: true,
        district: true,
        order_type: true,
        remarks: true,
        users: {
          select: {
            name: true,
          },
        },
        sales_list: {
          select: {
            id: true,
            order_qty: true,
            net_amount: true,
            pharmacy_name: true,
            generic_prodid: {
              select: {
                name: true,
                category: true,
                mrp: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_date: "desc",
      },
    });

    if (all.length > 0) {
      let requested = [];
      let others = [];
      let ofd = [];
      let packed = [];
      let delivered = [];
      all.forEach((order) => {
        if (order?.users?.name) {
          const decryptedUsername = decrypt(order.users.name, secretKey);
          order.users = decryptedUsername;
        }
        if (order.so_status === "Placed" || order.so_status === "placed") {
          requested.push(order);
        } else if (order.so_status === "Out for delivery") {
          ofd.push(order);
        } else if (order.so_status === "packed") {
          packed.push(order);
        } else if (order.so_status === "delivered") {
          delivered.push(order);
        } else {
          others.push(order);
        }
      });

      return response.status(200).json({
        success: true,
        data: all,
        requestlength: requested.length,
        packedlength: packed.length,
        outfordelivery: ofd.length,
        otherslength: others.length,
        deliveredlength: delivered.length,
      });
    } else {
      return response.status(404).json({
        success: false,
        message: "No sale orders found.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in allsalelistorders API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const checkaddress = async (request, response) => {
  try {
    const user_id = request.user.userId;

    // const user_id = request.body.user_id;
    if (user_id) {
      const check = await prisma.sales_order.findMany({
        where: {
          customer_id: user_id,
        },
        select: {
          delivery_address: true,
          city: true,
          district: true,
        },
      });

      if (check.length > 0) {
        const defaultaddress = [...new Set(check)];
        return response.status(200).json({
          success: true,
          data: defaultaddress,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy checkaddress API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    //await prisma.$disconnect();
  }
};

const updatesalesorder = async (request, response) => {
  const datetime = getCurrentDateInIST();
  try {
    const { sales_id, status } = request.body;
    if (!sales_id || !status) {
      return response.status(400).json({
        message: "sales id and status can't be null",
        error: true,
      });
    }
    const change = await prisma.sales_order.update({
      where: {
        sales_id: sales_id,
      },
      data: {
        so_status: status,
        updated_date: datetime,
      },
    });
    if (change) {
      return response.status(200).json({
        message: `successfully updated`,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in updatesalesorder API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const medicineadd = async (request, response) => {
  const datetime = getCurrentDateInIST();
  try {
    const { name, status, is_prescriped, created_by } = request.body;
    if (!name || !status || !is_prescriped) {
      return response.status(400).json({ error: "All fields are required" });
    }

    // const product_images = request.files;
    // let productImage = {};

    // for (i = 0; i < product_images?.length; i++) {
    //   let keyName = `image${i + 1}`;
    //   productImage[keyName] = product_images[i]?.location;
    // }
    const create = await prisma.medicines.create({
      data: {
        name,
        status,
        is_prescriped,
        created_by,
        created_date: datetime,
        status: "Y",
      },
    });
    if (create) {
      return response.status(200).json({
        message: "Successfully created",
        success: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in medicineadd API`);
    response.status(500).json("An error occurred");
  } finally {
    //await prisma.$disconnect();
  }
};

////////////////////invoice/////////////////

const getinvsalesorder = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const sales_id = request.body.sales_id;
    if (!sales_id) {
      return response.status(400).json({
        message: "sales_id can't be null",
        error: true,
      });
    }
    const getdata = await prisma.sales_order.findUnique({
      where: {
        sales_id: sales_id,
      },
      select: {
        sales_id: true,
        so_number: true,
        so_status: true,
        order_type: true,
        remarks: true,
        users: {
          select: {
            id: true,
            name: true,
          },
        },
        contact_no: true,
        created_date: true,
        delivery_address: true,
        doctor_name: true,
        city: true,
        district: true,
        pincode: true,
        prescription_image: true,
        patient_name: true,
        sales_list: {
          select: {
            id: true,
            order_qty: true,
            net_amount: true,
            pharmacy_name: true,
            generic_prodid: {
              select: {
                id: true,
                name: true,
                category: true,
                mrp: true,
                description: true,
                hsn: true,
                product_type: true,
              },
            },
          },
        },
      },
    });

    ///////////fixed discount 10%//////////////

    const decryptedUsername = decrypt(getdata?.users.name, secretKey);
    const userId = getdata?.users.id;
    const medication_details = (getdata.sales_list || getdata).map((item) => {
      const mrp = item?.generic_prodid?.mrp;
      const discount = mrp ? mrp * 0.1 : 0; // Calculate 10% discount
      const final_price = mrp ? mrp - discount : 0;

      return {
        id: item?.generic_prodid?.id || "",
        name: item?.generic_prodid?.name || "",
        category: item?.generic_prodid?.category || "",
        product_type: item?.generic_prodid?.product_type || "",
        batch_no: "",
        timing: [],
        afterFd_beforeFd: "",
        no_of_days: "",
        takingQuantity: "",
        totalQuantity: item?.order_qty || "",
        hsn: item?.generic_prodid?.hsn || "",
        mrp: item?.generic_prodid?.mrp || "",
        net_amount: item?.net_amount || "",
        selling_price: final_price || "",
      };
    });
    if (medication_details.length === 0) {
      medication_details.push({
        id: "",
        name: "",
        category: [],
        batch_no: "",
        timing: [],
        afterFd_beforeFd: "",
        takingQuantity: "",
        totalQuantity: "",
        no_of_days: "",
        hsn: "",
        mrp: "",
        selling_price: "",
      });
    }
    const responseData = {
      sales_id: getdata.sales_id,
      contact_no: getdata.contact_no,
      doctor_name: getdata.doctor_name,
      order_type: getdata.order_type,
      prescription_image: getdata?.prescription_image,
      username: decryptedUsername,
      userId: userId,
      delivery_address: getdata.delivery_address,
      district: getdata.district,
      city: getdata.city,
      medicine_details: medication_details,
      total: "",
    };
    response.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getinvsalesorder API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};
//////for normal type salesorder////////////////////////

const createinvoice = async (request, response) => {
  console.log("cretttttt", request.body);
  try {
    const datetime = getCurrentDateInIST();
    const { sales_id, sold_by, userId, doctor_name } = request.body;
    const medication_details = request.body.medicine_details;
    if (!sales_id || !medication_details || !sold_by) {
      return response.status(400).json({ error: "All fields are required" });
    }

    await prisma.$transaction(async (prisma) => {
      const updatesales = await prisma.sales_order.update({
        where: {
          sales_id,
        },
        data: {
          doctor_name,
          so_status: "confirmed",
          updated_date: istDate,
        },
      });

      if (updatesales) {
        for (const medicinedet of medication_details) {
          const {
            id,
            name,
            afterFd_beforeFd,
            totalQuantity,
            timing,
            takingQuantity,
            batch_no,
            selling_price,
            no_of_days,
            category,
            interval,
            every,
            product_type
          } = medicinedet;

          // Check if the category array includes "MEDICINES"

          if (category.some((item) => item.toLowerCase() === "medicines")) {
            const medicine = [{ id: id, name: name }];
            let newtiming = [];
            let timeInterval;
            let daysInterval;

            if (Array.isArray(timing)) {
              const timeMapping = {
                Morning: "time1",   ///changed Morning-morning
                lunch: "time2",
                dinner: "time3",
              };

              const timingObject = timing.reduce((acc, time) => {
                const key = timeMapping[time.toLowerCase()];
                if (key) {
                  acc[key] = time;
                }
                return acc;
              }, {});

              if (Object.keys(timingObject).length > 0) {
                newtiming.push(timingObject);
              }
            }
            if (every === "hours") {
              timeInterval = interval.toString();
            } else if (every === "days" || every === "weeks") {
              daysInterval = interval.toString();
            }

            await prisma.medicine_timetable.create({
              data: {
                userId: userId,
                sales_id: sales_id,
                medicine: medicine,
                afterFd_beforeFd,
                no_of_days,
                totalQuantity: totalQuantity.toString(),
                timing: newtiming,
                timeInterval: timeInterval,
                daysInterval: daysInterval,
                takingQuantity,
                app_flag: false,
                medicine_type:product_type,
                created_date: datetime,
              },
            });
          }

          await prisma.sales_list.updateMany({
            where: {
              sales_id: sales_id,
              product_id: id,
            },
            data: {
              batch_no: batch_no,
              selling_price: Number(selling_price),
            },
          });
        }
      }
    });

    return response.status(200).json({
      message: "Successfully created",
      success: true,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in createinvoice API`
    );
    console.log(error);
    response.status(500).json("An error occurred");
  } finally {
    //await prisma.$disconnect();
  }
};

///////////for prescription salesorder/////////////////

const prescriptioninvoice = async (request, response) => {
  const datetime = getCurrentDateInIST();
  try {
    const { sales_id, sold_by, total_amount, userId, doctor_name } =
      request.body;
    const medication_details = request.body.medicine_details;

    if (!sales_id || !medication_details || !userId) {
      return response.status(400).json({ error: "All fields are required" });
    }

    const total_amount_fixed = total_amount
      ? parseFloat(total_amount).toFixed(2)
      : null;

    await prisma.$transaction(async (prisma) => {
      const updatesales = await prisma.sales_order.update({
        where: {
          sales_id,
        },
        data: {
          doctor_name,
          so_status: "confirmed",
          updated_date: istDate,
        },
      });
      // const saleinvoice = await prisma.sales_invoice.create({
      //   data: {
      //     sales_id,
      //     sold_by,
      //     created_date: datetime,
      //   },
      // });

      await prisma.sales_order.update({
        where: {
          sales_id,
        },
        data: {
          total_amount: total_amount_fixed,
        },
      });

      for (const medicinedet of medication_details) {
        const {
          id,
          name,
          afterFd_beforeFd,
          totalQuantity,
          no_of_days,
          timing,
          takingQuantity,
          batch_no,
          selling_price,
          quantity,
          mrp,
          interval,
          every,
          category,
          product_type
        } = medicinedet;
        if (category.some((item) => item.toLowerCase() === "medicines")) {
          const medicine = [{ id: id, name: name }];
          let newtiming = [];
          let timeInterval;
          let daysInterval;

          if (Array.isArray(timing)) {
            const timeMapping = {
              Morning: "time1",  //changed morning-Morning
              lunch: "time2",
              dinner: "time3",
            };

            const timingObject = timing.reduce((acc, time) => {
              const key = timeMapping[time.toLowerCase()];
              if (key) {
                acc[key] = time;
              }
              return acc;
            }, {});

            if (Object.keys(timingObject).length > 0) {
              newtiming.push(timingObject);
            }
          }
          if (every === "hours") {
            timeInterval = interval.toString();
          } else if (every === "days" || every === "weeks") {
            daysInterval = interval.toString();
          }

          await prisma.medicine_timetable.create({
            data: {
              userId: userId,
              sales_id: sales_id,
              medicine: medicine,
              afterFd_beforeFd,
              no_of_days,
              totalQuantity,
              timing: newtiming,
              takingQuantity,
              app_flag: false,
              timeInterval: timeInterval,
              daysInterval: daysInterval,
              created_date: datetime,
              medicine_type:product_type
            },
          });
        }

        const net_amount = Number(totalQuantity) * Number(mrp);
        await prisma.sales_list.create({
          data: {
            generic_prodid: {
              connect: {
                id: id,
              },
            },
            sales_order: {
              connect: {
                sales_id: sales_id,
              },
            },

            order_qty: Number(totalQuantity),
            net_amount: net_amount,
            created_date: datetime,
            batch_no: batch_no,
            selling_price: Number(selling_price),
          },
        });
      }
    });

    response.status(200).json({
      message: "Successfully created",
      success: true,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in prescriptioninvoice API`
    );
    response.status(500).json("An error occurred");
  } finally {
    //await prisma.$disconnect();
  }
};

const getainvoice = async (request, response) => {
  try {
    const { id } = request.body;
    const getall = await prisma.medicine_timetable.findFirst({
      where: {
        id: id,
      },
    });
    if (getall) {
      return response.status(200).json({
        data: getall,
        success: true,
      });
    } else {
      return response.status(400).json({
        message: "No Data",
        error: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy-getainvoice API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    //await prisma.$disconnect();
  }
};

const myorders = async (request, response) => {
  try {
    const user_id = request.user.userId;
    const usertype = request.user.userType;
    console.log("userrrrrrrrr", request.user);
    if (!user_id) {
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }
    if (!usertype || usertype != "customer") {
      return response.status(400).json({
        error: true,
        message: "Please login as a customer",
      });
    }
    const salesordersdata = await prisma.sales_order.findMany({
      where: {
        customer_id: user_id,
      },
      orderBy: {
        created_date: "desc",
      },
      select: {
        sales_id: true,
        so_number: true,
        total_amount: true,
        so_status: true,
        order_type: true,
        delivery_address: true,
        city: true,
        district: true,
        created_date: true,
        contact_no: true,
        updated_date: true,
        pincode: true,
        sales_list: {
          select: {
            product_id: true,
            order_qty: true,
            net_amount: true,
            generic_prodid: {
              select: {
                id: true,
                name: true,
                category: true,
                images: true,
                mrp: true,
              },
            },
          },
        },
      },
    });
    console.log({ salesordersdata });
    if (salesordersdata.length > 0) {
      const salesorders = [];

      for (const order of salesordersdata) {
        const { sales_id, so_status, created_date, updated_date } = order;
        let data = {
          placed: true,
          placedDate: created_date,
          confirmed: false,
          confirmedDate: null,
          packed: false,
          packedDate: null,
          shipped: false,
          shippedDate: null,
          delivered: false,
          deliveryDate: null,
        };

        // Handle status-specific logic
        if (so_status === "confirmed") {
          data = {
            ...data,
            confirmed: true,
            confirmedDate: updated_date,
          };
        } else if (
          so_status === "packed" ||
          so_status === "shipped" ||
          so_status === "delivered"
        ) {
          const packedData = await prisma.pharmacy_assign.findFirst({
            where: { sales_id: sales_id },
            select: { Stmodified_date: true },
          });

          if (packedData) {
            data = {
              ...data,
              confirmed: true,
              confirmedDate: updated_date,
              packed: true,
              packedDate: packedData.Stmodified_date,
            };
          }

          if (so_status === "shipped" || so_status === "delivered") {
            const deliveryAgent = await prisma.delivery_assign.findFirst({
              where: { sales_id: sales_id },
              select: {
                status: true,
                assigned_date: true,
                delivered_date: true,
              },
            });

            if (deliveryAgent) {
              data = {
                ...data,
                shipped: true,
                shippedDate: deliveryAgent.assigned_date,
              };

              if (so_status === "delivered") {
                data = {
                  ...data,
                  delivered: true,
                  deliveryDate: deliveryAgent.delivered_date,
                };
              }
            }
          }
        }

        // Append enriched data to the order
        salesorders.push({ ...order, statusDetails: data });
      }

      return response.status(200).json({
        success: true,
        error: false,
        data: salesorders,
      });
    } else {
      return response.status(400).json({
        error: true,
        message: "No Data",
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in myorders API`);
    response.status(500).json("An error occurred");
  } finally {
    //await prisma.$disconnect();
  }
};

const getprods = async (request, response) => {
  try {
    const allproducts = await prisma.generic_product.findMany({
      where: {
        is_active: "Y",
      },
    });

    if (allproducts.length > 0) {
      const medication_details = allproducts.map((item) => {
        const mrp = item?.mrp;
        // Calculate 10% discount
        const discount = mrp ? mrp * 0.1 : 0;
        const selling_price = mrp ? mrp - discount : 0;

        return {
          ...item,
          selling_price,
        };
      });

      return response.status(200).json({
        data: medication_details,
        success: true,
      });
    } else {
      return response.status(404).json({
        data: [],
        success: false,
        message: "No active products found",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy getprods API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

//////////chatbot/////////////////////////////////////////////
const conversationHistory = []; // Initialize conversation history array

const updatedchat = async (request, response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const doctors = await prisma.doctor_details.findMany({
      select: {
        name: true,
        specialization: true,
      },
    });

    // Construct doctor list
    const doctorList = doctors
      .map((doctor) => `${doctor.name} (${doctor.specialization})`)
      .join("\n- ");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Your name is 'Dr. One.' You only respond to questions related to the medical field. If the question is not related to the medical field, then you will send a funny reply. First, you want to ask for the user's name, gender, and age group. Users will also tell their symptoms so you can suggest the appropriate doctor and specialty. If the doctors are not listed, then just specify which specialty doctor to consider. If users ask which doctor they should see, suggest one of the following:\n\n${doctorList}`,
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    const chatSession = model.startChat({
      generationConfig,
      history: conversationHistory, // Pass conversation history to startChat
    });

    const userInput = request.body.message;

    if (userInput.toLowerCase() !== "quit") {
      const result = await chatSession.sendMessage(userInput);

      response.status(200).json({
        message: result.response.candidates[0].content.parts[0]?.text,
      });

      // Update conversation history
      conversationHistory.push({
        role: "user",
        parts: [{ text: userInput }],
      });
      conversationHistory.push({
        role: "model",
        parts: [{ text: result.response.candidates[0].content.parts[0]?.text }],
      });
    } else {
      await chatSession.endChat(); // Gracefully end the chat session if the input is "quit"
      response.status(200).json({ message: "Chat session ended." });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in updatedchat API`);
    response.status(500).json("An error occurred");
  } finally {
    //await prisma.$disconnect();
  }
};

module.exports = {
  updatedchat,
  productadd,
  getproducts,
  addToCart,
  getCart,
  removeFromCart,
  salesorder,
  getasalesorder,
  updatesalesorder,
  pharmacyadd,
  getpharmacy,
  filterpharmacy,
  presciptionsaleorders,
  allsalelistorders,
  checkaddress,
  disableproduct,
  medicineadd,
  createinvoice,
  getainvoice,
  prescriptioninvoice,
  myorders,
  getinvsalesorder,
  getprods,
};
