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

const lab_profile = async (request, response) => {
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

const getnearestlabs = async (request, response) => {
  try {
    let { pincode } = request.body;

    if (!pincode) {
      return response.status(400).json({
        error: true,
        message: "pincode can't be null or empty.",
      });
    }

    if (isNaN(pincode)) {
      return response.status(400).json({
        error: true,
        message: "Invalid pincode provided.",
      });
    }

    let labs = await prisma.lab_details.findMany({});
    const givenPincode = pincode;
    function findNearestPinCodes(labs, givenPincode, count = 3) {
      labs.sort(
        (a, b) =>
          Math.abs(a.pincode - givenPincode) -
          Math.abs(b.pincode - givenPincode)
      );

      return labs.slice(0, count);
    }

    const nearestlabs = findNearestPinCodes(labs, givenPincode);
    return response.status(200).json({
      data: nearestlabs,
      success: true,
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-nearestlabs API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const labtestadd = async (request, response) => {
  const {
    name,
    mrp,
    description,
    type,
    category,
    home_collection,
    gender,
    age_group,
  } = request.body;

  const datetime = getCurrentDateInIST();
  try {
    const lwrcase_name = name.toLowerCase();
    const lwrcase_description = description.trim().toLowerCase();

    const lwrcase_type = type?.trim().toLowerCase();
    const lwrcase_category = category?.trim().toLowerCase();
    const lwrcase_gender = gender?.trim().toLowerCase();
    const lwrcase_age_group = age_group?.trim().toLowerCase();
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
        name: lwrcase_name,
        mrp,
        description: lwrcase_description,
        is_active: true,
        type: lwrcase_type,
        category: lwrcase_category,
        home_collection,
        gender: lwrcase_gender,
        age_group: lwrcase_age_group,
        test_number: testnumber,
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
    console.log(err);
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

const getalltests = async (request, response) => {
  try {
    const { first } = request.body;
    const getall = await prisma.labtest_details.findMany({
      take: first ? 5 : undefined,
      orderBy: {
        name: "asc",
      },
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        test_number: true,
        mrp: true,
      },
    });
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
///////////////getlabtest with auth///////////////
const gettestswithauth = async (request, response) => {
  try {
    const user_id = request.user.userId;
    const { first } = request.body;

    const getall = await prisma.labtest_details.findMany({
      take: first ? 5 : undefined,
      orderBy: {
        name: "asc",
      },
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        test_number: true,
        mrp: true,
      },
    });

    if (getall.length > 0) {
      const getcart = await prisma.labtest_cart.findMany({
        where: {
          user_id: user_id,
        },
        select: {
          test_number: true,
        },
      });

      const cartTestNumbers = getcart.map((item) => item.test_number);
      const dataWithCartStatus = getall.map((test) => ({
        ...test,
        incart: cartTestNumbers.includes(test.test_number),
      }));

      return response.status(200).json({
        data: dataWithCartStatus,
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
      `Internal server error: ${error.message} in labtest-gettestswithauth API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const testdetail = async (request, response) => {
  try {
    const { id } = request.body;

    const labtestDetails = await prisma.labtest_details.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        test_number: true,
        name: true,
        mrp: true,
        description: true,
        home_collection: true,
      },
    });
    if (labtestDetails) {
      return response.status(200).json({
        data: labtestDetails,
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
      `Internal server error: ${error.message} in labtest-testdetail API`
    );
    console.log(error);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};
//////////get test detail with auth//////////////////
const testdetailwithauth = async (request, response) => {
  try {
    const { id } = request.body;
    const user_id = request.user.userId;
    const labtestDetails = await prisma.labtest_details.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        test_number: true,
        name: true,
        mrp: true,
        description: true,
        home_collection: true,
      },
    });

    if (!labtestDetails) {
      return response.status(400).json({
        message: "No Test Found",
        error: true,
      });
    }
    const getcart = await prisma.labtest_cart.findFirst({
      where: {
        user_id: user_id,
        test_number: labtestDetails.test_number,
      },
      select: {
        id: true,
      },
    });
    console.log({ getcart });
    const details = {
      ...labtestDetails,
      incart: !!getcart,
    };
    return response.status(200).json({
      data: details,
      success: true,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-testdetailwithauth API`
    );
    console.log(error);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const labtestupdate = async (request, response) => {
  const {
    id,
    name,
    mrp,
    description,
    type,
    category,
    home_collection,
    gender,
    age_group,
  } = request.body;

  try {
    const labTest = await prisma.labtest_details.findUnique({
      where: { id },
    });

    if (!labTest) {
      return response.status(404).json({
        error: true,
        message: "Lab test not found",
      });
    }

    const lwrcase_name = name?.toLowerCase();
    const lwrcase_description = description?.trim().toLowerCase();
    const lwrcase_type = type?.trim().toLowerCase();
    const lwrcase_category = category?.trim().toLowerCase();
    const lwrcase_gender = gender?.trim().toLowerCase();
    const lwrcase_age_group = age_group?.trim().toLowerCase();

    const updatedLabTest = await prisma.labtest_details.update({
      where: { id },
      data: {
        name: lwrcase_name,
        mrp,
        description: lwrcase_description,
        is_active: true,
        type: lwrcase_type,
        category: lwrcase_category,
        home_collection,
        gender: lwrcase_gender,
        age_group: lwrcase_age_group,
      },
    });

    response.status(200).json({
      error: false,
      success: true,
      message: "Test updated successfully!",
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in labtest---labtestupdate API`
    );
    console.log(err);
    response.status(400).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};
////////////////lab packages/////////////////
const package_add = async (request, response) => {
  const { package_name, price, created_date, status, labtest_ids, about } =
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
  const is_active = status === "active";
  const testnumber = `P${String(lastNumber + 1).padStart(4, "0")}`;
  const isHomeCollection = async (labtest_ids) => {
    const labtest = await prisma.labtest_details.findFirst({
      where: {
        id: { in: labtest_ids },
        home_collection: false,
      },
      select: {
        id: true,
      },
    });

    return labtest ? false : true;
  };

  const is_home_collection = await isHomeCollection(labtest_ids);
  console.log({ is_home_collection });

  try {
    const add_data = await prisma.lab_packages.create({
      data: {
        package_name,
        price,
        created_date,
        is_active,
        labtest_ids,
        about,
        home_collection: is_home_collection,
        created_date: datetime,
        test_number: testnumber,
      },
    });

    response.status(200).json({
      error: false,
      success: true,
      message: "successfully created",
    });
  } catch (err) {
    console.log({ err });
    logger.error(
      `Internal server error: ${err.message} in labtest---labtestpckage add api`
    );
    response.status(400).json({
      error: true,
      message: "internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const package_update = async (request, response) => {
  const { id, package_name, price, status, labtest_ids } = request.body;

  const datetime = getCurrentDateInIST();

  try {
    const labPackage = await prisma.lab_packages.findUnique({
      where: { id },
    });

    if (!labPackage) {
      return response.status(404).json({
        error: true,
        message: "Lab package not found",
      });
    }

    const updatedLabPackage = await prisma.lab_packages.update({
      where: { id },
      data: {
        package_name,
        price,
        status,
        labtest_ids,
      },
    });

    response.status(200).json({
      error: false,
      success: true,
      message: "Successfully updated",
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in labtest---package_update API`
    );
    console.log(err);
    response.status(400).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getpackagetests = async (request, response) => {
  try {
    const getall = await prisma.lab_packages.findMany();
    if (getall.length > 0) {
      // const allLabTestIds = getall.flatMap((pkg) => pkg.labtest_ids);

      //       const labtestDetails = await prisma.labtest_details.findMany({
      //         where: {
      //           id: { in: allLabTestIds },
      //         },
      //       });

      //       const packagesWithTests = getall.map((pkg) => ({
      //         ...pkg,
      //         tests: labtestDetails.filter((test) =>
      //           pkg.labtest_ids.includes(test.id)
      //         ),
      //       }));
      // console.log({packagesWithTests})
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
      `Internal server error: ${error.message} in labtest-getpackagetests API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const getallpackages = async (request, response) => {
  try {
    const { first } = request.body;
    const getall = await prisma.lab_packages.findMany({
      take: first ? 5 : undefined,
      orderBy: {
        package_name: "desc",
      },
      where: {
        is_active: true,
      },
      select: {
        id: true,
        package_name: true,
        test_number: true,
        about: true,
        price: true,
        home_collection: true,
        labtest_ids: true,
      },
    });

    if (getall.length > 0) {
      const packagesWithTests = getall.map((pkg) => ({
        ...pkg,
        testslength: Array.isArray(pkg.labtest_ids)
          ? pkg.labtest_ids.length
          : 0,
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
    console.log(error);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};
///////////get packages with auth//////////
const getpackageswithauth = async (request, response) => {
  try {
    const user_id = request.user.userId;
    const { first } = request.body;
    const getall = await prisma.lab_packages.findMany({
      take: first ? 5 : undefined,
      orderBy: {
        package_name: "desc",
      },
      where: {
        is_active: true,
      },
      select: {
        id: true,
        package_name: true,
        test_number: true,
        about: true,
        price: true,
        home_collection: true,
        labtest_ids: true,
      },
    });

    if (getall.length > 0) {
      const getcart = await prisma.labtest_cart.findMany({
        where: {
          user_id: user_id,
        },
        select: {
          test_number: true,
        },
      });
      const cartTestNumbers = getcart.map((item) => item.test_number);
      const packagesWithTests = getall.map((pkg) => ({
        ...pkg,
        testslength: Array.isArray(pkg.labtest_ids)
          ? pkg.labtest_ids.length
          : 0,
        incart: cartTestNumbers.includes(pkg.test_number),
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
      `Internal server error: ${error.message} in labtest-getpackageswithauth API`
    );
    console.log(error);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const packagedetail = async (request, response) => {
  try {
    const { id } = request.body;
    const labPackage = await prisma.lab_packages.findFirst({
      where: { id },
      select: {
        id: true,
        test_number: true,
        package_name: true,
        price: true,
        labtest_ids: true,
        home_collection: true,
        about: true,
      },
    });
    if (labPackage) {
      const labTestIds = labPackage.labtest_ids || [];

      const labtestDetails = await prisma.labtest_details.findMany({
        where: {
          id: { in: labTestIds },
        },
        select: {
          id: true,
          name: true,
          mrp: true,
        },
      });

      const packageWithTests = {
        ...labPackage,
        tests: labtestDetails,
      };

      return response.status(200).json({
        data: packageWithTests,
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
      `Internal server error: ${error.message} in labtest-pacakagedetail API`
    );
    console.log(error);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

/////////get packagedetail with auth///////////
const packagedetailwithauth = async (request, response) => {
  try {
    const user_id = request.user.userId;
    const { id } = request.body;
    const labPackage = await prisma.lab_packages.findFirst({
      where: { id },
      select: {
        id: true,
        test_number: true,
        package_name: true,
        price: true,
        labtest_ids: true,
        home_collection: true,
        about: true,
      },
    });
    if (labPackage) {
      const getcart = await prisma.labtest_cart.findFirst({
        where: {
          user_id: user_id,
          test_number: labPackage.test_number,
        },
        select: {
          id: true,
        },
      });
      const labTestIds = labPackage.labtest_ids || [];

      const labtestDetails = await prisma.labtest_details.findMany({
        where: {
          id: { in: labTestIds },
        },
        select: {
          id: true,
          name: true,
          mrp: true,
        },
      });

      const packageWithTests = {
        ...labPackage,
        tests: labtestDetails,
        incart: !!getcart,
      };

      return response.status(200).json({
        data: packageWithTests,
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
      `Internal server error: ${error.message} in labtest-packagedetailwithauth API`
    );
    console.log(error);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const assignlab = async (request, response) => {
  try {
    const { order_id, lab_id, status } = request.body;
    const datetime = getCurrentDateInIST();

    // Validate the required fields
    if (!order_id || !lab_id) {
      return response.status(400).json({
        error: true,
        message: "cart_id and lab_id can't be null or empty.",
      });
    }
    const find = await prisma.labtest_order.findFirst({
      where: {
        order_id,
      },
    });
    if (find.lab_id != null) {
      return response.status(400).json({
        error: true,
        message: "lab already assigned",
      });
    }

    const add = await prisma.labtest_order.update({
      where: {
        order_id: order_id,
      },
      data: {
        lab_id,
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
  const user_id = request.user.userId;
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
            home_collection: labPackageDetail.home_collection,
            labtest_ids: labPackageDetail.labtest_ids,
          });
        }
      }
    }
    const hasCenter = extractedResponse.some(
      (item) => item.home_collection === false
    );

    response.status(200).json({
      success: true,
      data: {
        tests: extractedResponse,
        testLocation: hasCenter ? "center" : "home",
      },
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-gettestCart API`
    );
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
    logger.error(
      "user_id or test_number is undefined in removeTestFromCart API"
    );
    return response.status(400).json({
      error: true,
      message: "user_id and test_number are required",
    });
  }

  try {
    const result = await prisma.labtest_cart.deleteMany({
      where: {
        user_id: user_id,
        test_number,
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

const checkout = async (request, response) => {
  const usertype = request.user.userType;
  const {
    total_amount,
    status,
    remarks,
    order_type,
    delivery_location,
    pincode,
    contact_no,
    doctor_name,
    patientDetails,
    delivery_details,
  } = request.body;

  const userId = parseInt(request.user.userId);
  let test_order;

  try {
    if (!userId) {
      logger.error("user_id is undefined in labtest-checkout API");
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
    if (!delivery_details || !contact_no) {
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
      const to_num = "LO";
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1);
      const existingtestOrders = await prisma.labtest_order.findMany({
        where: {
          created_date: {
            gte: startOfYear,
            lt: endOfYear,
          },
        },
      });
      const newid = existingtestOrders.length + 1;
      const formattedNewId = ("0000" + newid).slice(-4);
      const order_number = to_num + lastTwoDigits + formattedNewId;
      let total_amount_fixed;

      if (total_amount) {
        total_amount_fixed = parseFloat(total_amount).toFixed(2);
      }

      const datetime = getCurrentDateInIST();

      test_order = await prisma.labtest_order.create({
        data: {
          order_number: order_number,
          total_amount: total_amount_fixed,
          status: "placed",
          remarks,
          order_type,
          patient_details: patientDetails,
          created_date: datetime,
          customer_id: userId,
          delivery_details: delivery_details,
          delivery_location: location,
          doctor_name: doctor_name,
          contact_no: contact_no.toString(),
          pincode: parseInt(pincode),
        },
      });

      if (order_type != "prescription") {
        let findcollection = "home";
        const tests=await prisma.labtest_cart.findMany({
          where:{
            user_id:userId
          },
          select:{
            test_number:true
          }
        })

        for (let test of tests) {
          let find;

          if (test.test_number.includes("T")) {
            find = await prisma.labtest_details.findFirst({
              where: {
                test_number: test.test_number,
              },
              select: {
                home_collection: true,
              },
            });
          } else {
            find = await prisma.lab_packages.findFirst({
              where: {
                test_number: test.test_number,
              },
              select: {
                home_collection: true,
              },
            });
          }
          if (find && !find.home_collection) {
            findcollection = "center";
          }
          await prisma.labtest_list.create({
            data: {
              labtest_order: {
                connect: {
                  order_id: test_order.order_id,
                },
              },
              test_number: test.test_number,
              created_date: datetime,
            },
          });
        }

        await prisma.labtest_cart.deleteMany({
          where: {
            user_id: userId,
          },
        });
        await prisma.labtest_order.update({
          where: {
            order_id: test_order.order_id,
          },
          data: {
            test_collection: findcollection,
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

        await prisma.labtest_order.update({
          where: {
            order_id: test_order.order_id,
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
    logger.error(
      `Internal server error: ${error.message} in labtest-checkout API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const myorders = async (request, response) => {
  try {
    const user_id = request.user.userId;
    const usertype = request.user.userType;

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
    const labtestsordersdata = await prisma.labtest_order.findMany({
      where: {
        customer_id: user_id,
      },
      orderBy: {
        created_date: "desc",
      },
    });

    if (labtestsordersdata.length > 0) {
      return response.status(200).json({
        success: true,
        error: false,
        data: labtestsordersdata,
      });
    } else {
      return response.status(400).json({
        error: true,
        message: "No Data",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-myorders API`
    );
    response.status(500).json("An error occurred");
  } finally {
    await prisma.$disconnect();
  }
};

const alltestlistorders = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const all = await prisma.labtest_order.findMany({
      select: {
        order_number: true,
        total_amount: true,
        status: true,
        remarks: true,
        delivery_details: true,
        delivery_location: true,
        patient_details: true,
        pincode: true,
        doctor_name: true,

        users: {
          select: {
            name: true,
          },
        },
        labtest_list: {
          select: {
            order_id: true,
            net_amount: true,
            order_qty: true,
            test_number: true,
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
        if (order.status === "Placed" || order.status === "placed") {
          requested.push(order);
        } else if (order.status === "Out for delivery") {
          ofd.push(order);
        } else if (order.status === "packed") {
          packed.push(order);
        } else if (order.status === "delivered") {
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
        message: "No test orders found.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in alltestlistorders API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

//get labs for assigning
const getlaboratories = async (request, response) => {
  try {
    const { order_id } = request.body;
    const getdetails = await prisma.labtest_order.findFirst({
      where: {
        order_id: order_id,
      },
      select: {
        order_number: true,
        labtest_list: true,
      },
    });
    let pincode = getdetails?.pincode;
    if (!pincode) {
      return response.status(400).json({
        error: true,
        message: "pincode can't be null or empty.",
      });
    }

    if (isNaN(pincode)) {
      return response.status(400).json({
        error: true,
        message: "Invalid pincode provided.",
      });
    }

    let labs = await prisma.lab_details.findMany({});
    const givenPincode = pincode;
    function findNearestPinCodes(labs, givenPincode, count = 3) {
      labs.sort(
        (a, b) =>
          Math.abs(a.pincode - givenPincode) -
          Math.abs(b.pincode - givenPincode)
      );

      return labs.slice(0, count);
    }

    const nearestlabs = findNearestPinCodes(labs, givenPincode);
    return response.status(200).json({
      data: nearestlabs,
      success: true,
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-getlaboratories API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

/////////////get order detailss//////////
const getorderdetails = async (request, response) => {
  try {
    const { order_id } = request.body;
    const getdetails = await prisma.labtest_order.findFirst({
      where: {
        order_id: order_id,
      },
      select: {
        order_id: true,
        total_amount: true,
        order_number: true,
        labtest_list: true,
        status: true,
        order_type: true,
        remarks: true,
        delivery_details: true,
        delivery_location: true,
        created_date: true,
        updated_date: true,
        contact_no: true,
        customer_id: true,
        patient_details: true,
        pincode: true,
        test_collection: true,
      },
    });
    if (!getdetails) {
      return response.status(404).json({
        message: "Order not found",
        success: false,
      });
    }

    const testdata = getdetails.labtest_list;
    const labtestDetails = [];
    for (const data of testdata) {
      let testDetail;
      if (data.test_number.includes("T")) {
        testDetail = await prisma.labtest_order.findFirst({
          where: {
            test_number: data.test_number,
          },
          select: {
            test_number: true,
            name: true,
            mrp: true,
            description: true,
          },
        });
      } else {
        testDetail = await prisma.lab_packages.findFirst({
          where: {
            test_number: data.test_number,
          },
          select: {
            test_number: true,
            package_name: true,
            price: true,
            about: true,
          },
        });
      }
      if (testDetail) {
        labtestDetails.push(testDetail);
      }
    }
    const responseDetails = {
      ...getdetails,
      labtest_details: labtestDetails,
    };
    return response.status(200).json({
      data: responseDetails,
      success: true,
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-getorderdetails API`
    );
    response.status(500).json({ error: "Internal Server Error" });
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
  removeTestFromCart,
  labtestupdate,
  package_update,
  getalltests,
  getallpackages,
  packagedetail,
  testdetail,
  getnearestlabs,
  assignlab,
  myorders,
  checkout,
  alltestlistorders,
  getlaboratories,
  gettestswithauth,
  getpackageswithauth,
  packagedetailwithauth,
  testdetailwithauth,
  getorderdetails,
};
