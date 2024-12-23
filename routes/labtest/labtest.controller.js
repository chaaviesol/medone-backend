const {
  getCurrentDateInIST,
  istDate,
  logger,
  prisma,
  decrypt,
} = require("../../utils");
const bcrypt = require("bcrypt");
const datetime = getCurrentDateInIST();
require("dotenv").config();

const labadd = async (request, response) => {
  try {
    const {
      name,
      phone_no,
      address,
      email,
      pincode,
      about,
      test_id,
      package_id,
    } = request.body;

    // Check if required fields are present
    if (!name || !phone_no || !address || !email || !pincode) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }

    // Check if email already exists
    const checkEmail = await prisma.lab_details.findFirst({
      where: { email },
    });

    // Check if phone number already exists
    const checkPhoneNumber = await prisma.lab_details.findFirst({
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
    const create = await prisma.lab_details.create({
      data: {
        name,
        phone_no,
        address,
        lisence_no,
        email,
        pincode,
        about,
        test_id,
        package_id,
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
    logger.error(`Internal server error: ${error.message} in labadd API`);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const getlabs = async (request, response) => {
  try {
    const getall = await prisma.lab_details.findMany();
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
    logger.error(
      `Internal server error: ${error.message} in labtest--getlabs API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const lab_profile = async (request, res) => {
  try {
    const { id } = request.body;
    if (!id) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "lab id is required!",
      });
    }
    const finddetails = await prisma.lab_details.findUnique({
      where: {
        id: id,
      },
    });

    return response.status(200).json({
      error: false,
      success: true,
      data: finddetails,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in lab_profile api`);
    response.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
};

const labtestadd = async (request, response) => {
  const {
    name,
    mrp,
    description,
    status,
    photo,
    type,
    category,
    home_collection,
    gender,
    age_group,
  } = request.body;
  const datetime = getCurrentDateInIST();
  try {
    const lastTest = await prisma.labtest_details.findFirst({
      orderBy: {
        id: "desc",
      },
    });

    const lastNumber = lastTest?.test_number
      ? parseInt(lastTest.test_number.slice(1))
      : 0;

    const testnumber = `T${String(lastNumber + 1).padStart(4, "0")}`;
    const adddata = await prisma.labtest_details.create({
      data: {
        name,
        mrp,
        description,
        status,
        photo,
        type,
        category,
        home_collection,
        gender,
        age_group,
        testnumber: testnumber,
        created_date: datetime,
      },
    });

    response.status(200).json({
      error: false,
      success: true,
      message: "successfully created",
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in labtest---labtestass api`
    );
    response.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
};

const getlabtests = async (request, response) => {
  try {
    const getall = await prisma.labtest_details.findMany();
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
    logger.error(
      `Internal server error: ${error.message} in labtest-getlabtests API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const package_add = async (request, response) => {
  const { package_name, price, created_date, status, labtest_ids } =
    request.body;
  const datetime = getCurrentDateInIST();
  const lastTest = await prisma.lab_packages.findFirst({
    orderBy: {
      id: "desc",
    },
  });

  const lastNumber = lastTest?.test_number
    ? parseInt(lastTest.test_number.slice(1))
    : 0;

  const testnumber = `T${String(lastNumber + 1).padStart(4, "0")}`;
  try {
    const add_data = await prisma.lab_packages.create({
      data: {
        package_name,
        price,
        created_date,
        status,
        labtest_ids,
        created_date: datetime,
        testnumber: testnumber,
      },
    });

    response.status(200).json({
      error: false,
      success: true,
      message: "successfully created",
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in labtest---labtestass api`
    );
    response.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
};

const getpackagetests = async (request, response) => {
  try {
    const getall = await prisma.lab_packages.findMany();
    if (getall.length > 0) {
      const allLabTestIds = getall.flatMap((pkg) => pkg.labtest_ids);

      const labtestDetails = await prisma.labtest_details.findMany({
        where: {
          id: { in: allLabTestIds },
        },
      });

      const packagesWithTests = getall.map((pkg) => ({
        ...pkg,
        tests: labtestDetails.filter((test) =>
          pkg.labtest_ids.includes(test.id)
        ),
      }));

      return response.status(200).json({
        data: packagesWithTests,
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
      `Internal server error: ${error.message} in labtest-getpackagetests API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const assignlab = async (request, response) => {
  try {
    const { cart_id, lab_id, status } = request.body;
    const datetime = getCurrentDateInIST();

    // Validate the required fields
    if (!cart_id || !lab_id) {
      return response.status(400).json({
        error: true,
        message: "sales_id and pharmacy_id can't be null or empty.",
      });
    }
    const find = await prisma.lab_assign.findFirst({
      where: {
        cart_id,
        lab_id,
      },
    });
    if (find) {
      return response.status(400).json({
        error: true,
        message: "pharmacy already assigned",
      });
    }

    const add = await prisma.pharmacy_assign.create({
      data: {
        status: status,
        cart_id,
        lab_id,
        created_date: datetime,
      },
    });

    if (add) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "lab assigned successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in lab_assign-labtest API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const testToCart = async (request, response) => {
  const { test_number } = request.body;
  const user_id = request.user.userId;
  const datetime = getCurrentDateInIST();
  try {
    if (!user_id || !test_number) {
      logger.error("user_id, test_number is undefined in testToCart API");
      return response.status(400).json({
        error: true,
        message: "user_id and test_number are required fields",
      });
    }

    const existingCartItem = await prisma.labtest_cart.findFirst({
      where: {
        user_id: user_id,
        test_number,
      },
    });

    if (existingCartItem) {
      return response.status(400).json({
        error: true,
        message: "Already added in your cart",
      });
    }

    // Add product to cart
    const data = await prisma.labtest_cart.create({
      data: {
        user_id: user_id,
        test_number,
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
      `Internal server error: ${error.message} in labtest--> labtocart API`
    );

    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const gettestCart = async (request, response) => {
  const user_id = request.user?.userId;

  try {
    if (!user_id) {
      logger.error("user_id is undefined in labtest-getCart API");
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }

    const cartItems = await prisma.labtest_cart.findMany({
      where: {
        user_id,
      },
      orderBy: {
        created_date: "desc",
      },
      select: {
        test_number: true,
      },
    });

    if (!cartItems.length) {
      return response.status(200).json({
        success: true,
        data: [],
        message: "No items in the cart.",
      });
    }

    const extractedResponse = [];

    for (const item of cartItems) {
      const { test_number } = item;

      if (test_number.startsWith("T")) {
        const labtestDetail = await prisma.labtest_details.findFirst({
          where: { test_number },
        });

        if (labtestDetail) {
          extractedResponse.push({
            name: labtestDetail.name,
            id: labtestDetail.id,
            test_number: labtestDetail.test_number,
            price: labtestDetail.mrp,
            description: labtestDetail.description,
            type: labtestDetail.type,
            category: labtestDetail.category,
            home_collection: labtestDetail.home_collection,
            gender: labtestDetail.gender,
            age_group: labtestDetail.age_group,
            photo: labtestDetail.photo,
          });
        }
      } else if (test_number.startsWith("P")) {
        const labPackageDetail = await prisma.lab_packages.findFirst({
          where: { test_number },
        });

        if (labPackageDetail) {
          extractedResponse.push({
            name: labPackageDetail.package_name,
            id: labPackageDetail.id,
            test_number: labPackageDetail.test_number,
            price: labPackageDetail.price,
            labtest_ids: labPackageDetail.labtest_ids,
          });
        }
      }
    }

    response.status(200).json({
      success: true,
      data: extractedResponse,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in gettestCart API`);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const removeTestFromCart = async (request, response) => {
  const { test_number } = request.body;
  const user_id = request.user.userId;
  if (!user_id || !test_number) {
    logger.error("user_id or test_number is undefined in removeTestFromCart API");
    return response.status(400).json({
      error: true,
      message: "user_id and test_number are required",
    });
  }

  try {
    const result = await prisma.labtest_cart.deleteMany({
      where: {
        user_id: user_id,
        test_number
      },
    });

    if (result.count === 0) {
      return response.status(404).json({
        success: false,
        message: "No such test found in cart",
      });
    }

    response.status(200).json({
      success: true,
      message: "Successfully deleted from cart",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in removeTestFromCart API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};


module.exports = {
  labtestadd,
  getlabtests,
  package_add,
  getpackagetests,
  labadd,
  getlabs,
  lab_profile,
  testToCart,
  gettestCart,
  removeTestFromCart
};
