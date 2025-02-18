const { error } = require("winston");
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
      test_ids,
      package_id,
    } = request.body;

    // Check if required fields are present
    if (!name || !address || !pincode || !phone_no) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }
    if (!test_ids || test_ids.length === 0) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "Please add at least one lab test.",
      });
    }
    if (email) {
      // Check if email already exists
      const checkEmail = await prisma.lab_details.findFirst({
        where: { email },
      });
      if (checkEmail) {
        return response.status(400).json({
          message: "Email ID already exists",
          error: true,
        });
      }
    }
    if (phone_no) {
      // Check if phone number already exists
      const checkPhoneNumber = await prisma.lab_details.findFirst({
        where: { phone_no },
      });

      if (checkPhoneNumber) {
        return response.status(400).json({
          message: "Phone number already exists",
          error: true,
        });
      }
    }

    // Create a new pharmacy record
    const create = await prisma.lab_details.create({
      data: {
        name,
        phone_no,
        address,
        email,
        pincode,
        about,
        test_ids,
        package_id,
        created_date: datetime,
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
    console.log(error);
    logger.error(`Internal server error: ${error.message} in labadd API`);

    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const getlabs = async (request, response) => {
  try {
    const getall = await prisma.lab_details.findMany({
      orderBy:{
        name:"asc"
      }
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

    const labTestIds = finddetails?.test_ids || [];
    const packageIds = finddetails?.package_id || [];

    const labtestDetails = await prisma.labtest_details.findMany({
      where: {
        id: { in: labTestIds },
      },
      select: {
        id: true,
        name: true,
        mrp: true,
        description: true,
        home_collection: true,
      },
    });
    const packageDetails = await prisma.lab_packages.findMany({
      where: {
        id: { in: packageIds },
      },
      select: {
        id: true,
        package_name: true,
        price: true,
        about: true,
        home_collection: true,
        health_concern: true,
      },
    });

    const packageWithTests = {
      ...finddetails,
      tests: labtestDetails,
      packages: packageDetails,
    };

    return response.status(200).json({
      error: false,
      success: true,
      data: packageWithTests,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in lab_profile api`);
    response.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
};

const labupdate = async (request, response) => {
  console.log("ooooooooooooo", request.body);
  try {
    const {
      id,
      name,
      phone_no,
      address,
      email,
      pincode,
      about,
      test_ids,
      package_id,
    } = request.body;

    // Check if required fields are present
    if (!name || !address || !pincode) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }
    if (!test_ids || test_ids.length === 0) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "Please add at least one lab test.",
      });
    }
    // // Check if email already exists
    // const checkEmail = await prisma.lab_details.findFirst({
    //   where: { email },
    // });

    // // Check if phone number already exists
    // const checkPhoneNumber = await prisma.lab_details.findFirst({
    //   where: { phone_no },
    // });

    // if (checkEmail) {
    //   return response.status(400).json({
    //     message: "Email ID already exists",
    //     error: true,
    //   });
    // }

    // if (checkPhoneNumber) {
    //   return response.status(400).json({
    //     message: "Phone number already exists",
    //     error: true,
    //   });
    // }

    // Create a new pharmacy record
    const create = await prisma.lab_details.update({
      where: {
        id: id,
      },
      data: {
        name,
        phone_no,
        address,
        email,
        pincode,
        about,
        test_ids,
        package_id,
      },
    });

    if (create) {
      return response.status(200).json({
        message: "Successfully updated",
        error: false,
        success: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in lab-update API`);
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
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
///////////////////test-lab///////////////////////

const labtestadd = async (request, response) => {
  console.log("rrrrrrrrrrr", request.body);
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
    if (!name || !mrp || !description || !age_group) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "mandatory fields can't be null",
      });
    }
    const lwrcase_name = name.toLowerCase();
    const lwrcase_description = description.trim().toLowerCase();

    const lwrcase_type = type?.trim().toLowerCase();
    const lwrcase_category = category?.trim().toLowerCase();
    const lwrcase_gender = gender?.trim().toLowerCase();
    // const lwrcase_age_group = age_group?.trim().toLowerCase();
    const lwrcase_age_group = age_group
      ?.map((group) => group.trim().toLowerCase())
      .join(", ");
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
        mrp: parseInt(mrp),
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
    if (adddata) {
      response.status(200).json({
        error: false,
        success: true,
        message: "successfully created",
      });
    }
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
        home_collection: true,
        description: true,
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
  console.log("heeeeeee");
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
        category: true,
        gender: true,
        age_group: true,
        type: true,
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
  console.log("uuuuuuuuuuppppppppp", request.body);
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
    // const lwrcase_age_group = age_group?.trim().toLowerCase();
    const lwrcase_age_group = Array.isArray(age_group)
      ? age_group.map((group) => group.trim().toLowerCase()).join(", ")
      : age_group;

    const updatedLabTest = await prisma.labtest_details.update({
      where: { id },
      data: {
        name: lwrcase_name,
        mrp: parseInt(mrp),
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
  console.log("dddddddddddd")
  const { package_name, price, created_date, status, labtest_ids, about } =
    request.body;
  // Validate mandatory fields
  if (!package_name || !price || !about) {
    return response.status(400).json({
      error: true,
      success: false,
      message: "Mandatory fields (package_name, price, about) cannot be null.",
    });
  }

  // Validate labtest_ids
  if (!labtest_ids || labtest_ids.length === 0) {
    return response.status(400).json({
      error: true,
      success: false,
      message: "Please add at least one lab test.",
    });
  }

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

// const package_update = async (request, response) => {
//   const { id, package_name, price, labtest_ids } = request.body;

//   const datetime = getCurrentDateInIST();

//   try {
//     const labPackage = await prisma.lab_packages.findUnique({
//       where: { id },
//     });

//     if (!labPackage) {
//       return response.status(404).json({
//         error: true,
//         message: "Lab package not found",
//       });
//     }
//     const isHomeCollection = async (labtest_ids) => {
//       const labtest = await prisma.labtest_details.findFirst({
//         where: {
//           id: { in: labtest_ids },
//           home_collection: false,
//         },
//         select: {
//           id: true,
//         },
//       });

//       return labtest ? false : true;
//     };

//     const is_home_collection = await isHomeCollection(labtest_ids);
//     console.log({ is_home_collection });

//     const updatedLabPackage = await prisma.lab_packages.update({
//       where: { id },
//       data: {
//         package_name,
//         price,
//         labtest_ids,
//         home_collection:is_home_collection
//       },
//     });

//     response.status(200).json({
//       error: false,
//       success: true,
//       message: "Successfully updated",
//     });
//   } catch (err) {
//     logger.error(
//       `Internal server error: ${err.message} in labtest---package_update API`
//     );
//     console.log(err);
//     response.status(400).json({
//       error: true,
//       message: "Internal server error",
//     });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

const package_update = async (request, response) => {
  const { id, package_name, price, labtest_ids } = request.body;
  console.log(request.body);

  if (!id || !Array.isArray(labtest_ids) || labtest_ids.length === 0) {
    return response.status(400).json({
      error: true,
      message: "Invalid request. ID and labtest_ids are required.",
    });
  }

  const datetime = getCurrentDateInIST();

  try {
    const labPackage = await prisma.lab_packages.findUnique({ where: { id } });

    if (!labPackage) {
      return response.status(404).json({
        error: true,
        message: "Lab package not found",
      });
    }

    // Function to check if all tests support home collection
    const isHomeCollection = async (labtestIds) => {
      const nonHomeTests = await prisma.labtest_details.findMany({
        where: {
          id: { in: labtestIds },
          home_collection: false,
        },
        select: { id: true },
      });

      return nonHomeTests.length === 0;
    };

    const is_home_collection = await isHomeCollection(labtest_ids);
    console.log({ is_home_collection });

    const updatedLabPackage = await prisma.lab_packages.update({
      where: { id },
      data: {
        package_name,
        price,
        labtest_ids,
        home_collection: is_home_collection,
      },
    });

    return response.status(200).json({
      error: false,
      success: true,
      message: "Successfully updated",
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in labtest---package_update API`
    );
    console.error(err);
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
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
          description: true,
          home_collection: true,
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
    const { order_id, lab_id } = request.body;
    const datetime = getCurrentDateInIST();
    console.log("laaaaaaaaa", request.body);
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
        status: "confirmed",
        updated_date: datetime,
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
  const user_id = request.body.userId;
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
  const user_id = request.body.userId;
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
  const user_id = request.body.userId;
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

  const userId = request.body.userId;
  let test_order;

  try {
    if (!userId) {
      logger.error("user_id is undefined in labtest-checkout API");
      return response.status(400).json({
        error: true,
        message: "user_id is required",
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
        const tests = await prisma.labtest_cart.findMany({
          where: {
            user_id: userId,
          },
          select: {
            test_number: true,
          },
        });

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
    const user_id = request.body.userId;

    if (!user_id) {
      return response.status(400).json({
        error: true,
        message: "user_id is required",
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
      where: {
        order_type: { not: "prescription" },
      },
      select: {
        order_id: true,
        order_number: true,
        total_amount: true,
        status: true,
        remarks: true,
        delivery_details: true,
        delivery_location: true,
        patient_details: true,
        created_date: true,
        pincode: true,
        doctor_name: true,
        test_collection: true,
        contact_no: true,
        users: {
          select: {
            name: true,
          },
        },
        labtest_list: {
          select: {
            order_id: true,
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
      where: { order_id },
      select: {
        order_number: true,
        labtest_list: {
          select: { test_number: true },
        },
        pincode: true,
        lab_id: true,
        lab_details: {
          select: {
            name: true,
            pincode: true,
            address: true,
            phone_no: true,
          },
        },
      },
    });
    if (!getdetails) {
      return response
        .status(400)
        .json({ error: true, message: "getdetails can't be null" });
    }
    if (getdetails.lab_id != null) {
      const responseby = [
        {
          name: getdetails?.lab_details?.name,
          address: getdetails?.lab_details?.address,
          pincode: getdetails?.lab_details?.pincode,
          phone_no: getdetails?.lab_details?.phone_no,
          button_status: "assigned",
        },
      ];
      return response.status(200).json({
        data: responseby,
        success: true,
      });
    } else {
      if (!getdetails || !getdetails.pincode) {
        return response
          .status(400)
          .json({ error: true, message: "Pincode can't be null or empty." });
      }

      if (isNaN(getdetails.pincode)) {
        return response
          .status(400)
          .json({ error: true, message: "Invalid pincode provided." });
      }

      const testdetails = getdetails.labtest_list;
      let testids = [];
      let packageids = [];

      for (const test of testdetails) {
        if (test?.test_number.includes("T")) {
          const find = await prisma.labtest_details.findFirst({
            where: { test_number: test?.test_number },
            select: { id: true },
          });
          if (find) testids.push(find.id);
        } else if (test?.test_number.includes("P")) {
          const find = await prisma.lab_packages.findFirst({
            where: { test_number: test?.test_number },
            select: { id: true },
          });
          if (find) packageids.push(find.id);
        }
      }
      console.log("hhhhhhhhhh", testids, "dddddddddddddd", packageids);
      // Filter labs that contain the required test_ids and package_ids
      let filteredLabs = await prisma.lab_details.findMany({
        where: {
          AND: [
            { test_ids: { array_contains: testids } }, // Match test_ids in the lab
            { package_id: { array_contains: packageids } }, // Match package_ids in the lab
          ],
        },
      });
      console.log({ filteredLabs });
      if (filteredLabs.length === 0) {
        return response
          .status(404)
          .json({ error: true, message: "No labs found matching criteria." });
      }

      // Sort labs based on the nearest pincode
      function findNearestPinCodes(labs, givenPincode, count = 3) {
        return labs
          .sort(
            (a, b) =>
              Math.abs(a.pincode - givenPincode) -
              Math.abs(b.pincode - givenPincode)
          )
          .slice(0, count);
      }

      let nearestLabs = findNearestPinCodes(filteredLabs, getdetails.pincode);
      nearestLabs = nearestLabs.map((lab) => ({
        ...lab,
        button_status: "assign",
      }));

      return response.status(200).json({
        data: nearestLabs,
        success: true,
        error: false,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-getlaboratories API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

// const getlaboratories = async (request, response) => {
//   try {
//     const { order_id } = request.body;
//     const getdetails = await prisma.labtest_order.findFirst({
//       where: {
//         order_id: order_id,
//       },
//       select: {
//         order_number: true,
//         labtest_list: true,
//       },
//     });
//     let pincode = getdetails?.pincode;
//     if (!pincode) {
//       return response.status(400).json({
//         error: true,
//         message: "pincode can't be null or empty.",
//       });
//     }

//     if (isNaN(pincode)) {
//       return response.status(400).json({
//         error: true,
//         message: "Invalid pincode provided.",
//       });
//     }

//     let labs = await prisma.lab_details.findMany({});
//     const givenPincode = pincode;
//     function findNearestPinCodes(labs, givenPincode, count = 3) {
//       labs.sort(
//         (a, b) =>
//           Math.abs(a.pincode - givenPincode) -
//           Math.abs(b.pincode - givenPincode)
//       );

//       return labs.slice(0, count);
//     }

//     const nearestlabs = findNearestPinCodes(labs, givenPincode);
//     return response.status(200).json({
//       data: nearestlabs,
//       success: true,
//       error: false,
//     });
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in labtest-getlaboratories API`
//     );
//     response.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

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

    const testdata = getdetails?.labtest_list;
    const labtestDetails = [];
    for (const data of testdata) {
      let testDetail;
      if (data.test_number.includes("T")) {
        testDetail = await prisma.labtest_details.findFirst({
          where: {
            test_number: data.test_number,
          },
          select: {
            test_number: true,
            name: true,
            mrp: true,
            description: true,
            home_collection: true,
          },
        });
        if (testDetail) {
          labtestDetails.push({
            ...testDetail,
            type: "test",
          });
        }
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
            home_collection: true,
          },
        });
        if (testDetail) {
          labtestDetails.push({
            test_number: testDetail.test_number,
            name: testDetail.package_name,
            mrp: testDetail.price,
            description: testDetail.about,
            home_collection: testDetail.home_collection,
            type: "package",
          });
        }
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
    console.log(error);
    logger.error(
      `Internal server error: ${error.message} in labtest-getorderdetails API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getallpktests = async (request, response) => {
  try {
    const getall = await prisma.labtest_details.findMany();
    const getallpkg = await prisma.lab_packages.findMany();

    if (getall.length > 0 && getallpkg.length > 0) {
      return response.status(200).json({
        data: { getall, getallpkg },
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

const assignflebo = async (request, response) => {
  console.log("ffffffffffffffff", request.body);
  try {
    const { order_id, phlebo_id } = request.body;
    const datetime = getCurrentDateInIST();
    console.log("laaaaaaaaa", request.body);
    // Validate the required fields
    if (!order_id || !phlebo_id) {
      return response.status(400).json({
        error: true,
        message: "phlebo_id and order_id can't be null or empty.",
      });
    }
    const find = await prisma.labtest_order.findFirst({
      where: {
        order_id,
      },
    });
    if (find.phlebo_id != null) {
      return response.status(400).json({
        error: true,
        message: "phlebo already assigned",
      });
    }

    const add = await prisma.labtest_order.update({
      where: {
        order_id: order_id,
      },
      data: {
        phlebo_id,

        updated_date: datetime,
      },
    });

    if (add) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "phlebo assigned successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in assignflebo-labtest API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getphelboassists = async (request, response) => {
  const { order_id } = request.body;
  try {
    const find = await prisma.labtest_order.findFirst({
      where: {
        order_id: order_id,
      },
      select: {
        delivery_location: true,
        pincode: true,
        phlebo_id: true,
        phleboid: {
          select: {
            name: true,
            gender: true,
            phone: true,
            location: true,
            pincode: true,
          },
        },
      },
    });

    if (!find) {
      return response.status(404).json({
        error: true,
        message: "Order not found",
      });
    }

    if (find.phlebo_id != null) {
      const responseby = [
        {
          gender: find?.phleboid?.gender,
          address: find?.phleboid?.address,
          pincode: find?.phleboid?.pincode,
          phone: find?.phleboid?.phone,
          name: find?.phleboid?.name,
          button_status: "assigned",
        },
      ];
      return response.status(200).json({
        data: responseby,
        success: true,
      });
    } else {
      const allassists = await prisma.phlebo_details.findMany({
        select: {
          id: true,
          name: true,
          location: true,
          gender: true,
          phone: true,
          address: true,
          pincode: true,
        },
      });

      if (allassists.length > 0) {
        // Function to calculate distance using Haversine formula
        const haversineDistance = (lat1, lon1, lat2, lon2) => {
          const toRad = (x) => (x * Math.PI) / 180;
          const R = 6371; // Radius of the Earth in km
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
              Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c; // Distance in km
        };

        // Extract delivery location coordinates
        const deliveryLocation =
          find.delivery_location[0] || find.delivery_location;
        console.log({ deliveryLocation });
        const deliveryLat = deliveryLocation?.lat;
        const deliveryLng = deliveryLocation?.lng;

        // Calculate distance for each phlebo and add it to the object
        allassists.forEach((phlebo) => {
          const phleboLocation = phlebo.location[0];
          const phleboLat = phleboLocation.lat;
          const phleboLng = phleboLocation.lng;
          phlebo.distance = haversineDistance(
            deliveryLat,
            deliveryLng,
            phleboLat,
            phleboLng
          );
          phlebo.button_status = "assign";
        });

        // Sort phlebos by distance (closest first)
        const sortedAssists = allassists.sort(
          (a, b) => a.distance - b.distance
        );

        // Get the top 3 nearest phlebos
        const nearestassists = sortedAssists.slice(0, 3);

        return response.status(200).json({
          data: nearestassists,
          success: true,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services- getphelboassists API`
    );
    console.log(error);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

// const prescriptionupload = async (request, response) => {
//   console.log("rrrrrrrrrrr", request.body);
//   let requestData;
//   requestData =
//     typeof request.body.data === "string"
//       ? JSON.parse(request.body.data)
//       : request.body.data;
//   const {
//     remarks,
//     order_type,
//     delivery_location,
//     pincode,
//     contact_no,
//     doctor_name,
//     patientDetails,
//     delivery_details,
//     userId,
//   } = requestData;

//   let test_order;

//   try {
//     if (!userId) {
//       logger.error("user_id is undefined in labtest-prescriptionupload API");
//       return response.status(400).json({
//         error: true,
//         message: "user_id is required",
//       });
//     }

//     if (!delivery_details || !contact_no) {
//       return response.status(400).json({
//         error: true,
//         message: "Missing delivery details",
//       });
//     }

//     if (!order_type) {
//       return response.status(400).json({
//         error: true,
//         message: "Missing order_type field",
//       });
//     }
//     let location;
//     if (order_type != "prescription") {
//       location = delivery_location;
//     } else {
//       // location = JSON.parse(delivery_location);
//       location = delivery_location;
//     }

//     await prisma.$transaction(async (prisma) => {
//       const currentDate = new Date();
//       const year = currentDate.getFullYear();

//       const lastTwoDigits = year.toString().slice(-2);
//       const to_num = "LO";
//       const startOfYear = new Date(new Date().getFullYear(), 0, 1);
//       const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1);
//       const existingtestOrders = await prisma.labtest_order.findMany({
//         where: {
//           created_date: {
//             gte: startOfYear,
//             lt: endOfYear,
//           },
//         },
//       });
//       const newid = existingtestOrders.length + 1;
//       const formattedNewId = ("0000" + newid).slice(-4);
//       const order_number = to_num + lastTwoDigits + formattedNewId;

//       const datetime = getCurrentDateInIST();

//       test_order = await prisma.labtest_order.create({
//         data: {
//           order_number: order_number,
//           status: "placed",
//           remarks,
//           order_type,
//           patient_details: patientDetails,
//           created_date: datetime,
//           customer_id: userId,
//           delivery_details: delivery_details,
//           delivery_location: location,
//           doctor_name: doctor_name,
//           contact_no: contact_no.toString(),
//           pincode: parseInt(pincode),
//         },
//       });

//       if (order_type === "prescription") {
//         const prescription_image = request.files;
//         let imageprescription = {};

//         if (!prescription_image || prescription_image.length === 0) {
//           return response.status(400).json({
//             message: "Please attach at least one report",
//             error: true,
//           });
//         }

//         for (i = 0; i < prescription_image?.length; i++) {
//           let keyName = `image${i + 1}`;
//           imageprescription[keyName] = prescription_image[i].location;
//         }

//         await prisma.labtest_order.update({
//           where: {
//             order_id: test_order.order_id,
//           },
//           data: {
//             prescription_image: imageprescription,
//             created_date: datetime,
//           },
//         });

//         response.status(200).json({
//           success: true,
//           message: "Prescription submitted.",
//         });
//       }
//     });
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in labtest-prescriptionupload API`
//     );
//     response.status(500).json({
//       error: true,
//       message: "Internal server error",
//     });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

const prescriptionupload = async (request, response) => {
  console.log("rrrrrrrrrrr", request.body);
  let requestData =
    typeof request.body.data === "string"
      ? JSON.parse(request.body.data)
      : request.body.data;

  const {
    remarks,
    order_type,
    delivery_location,
    pincode,
    contact_no,
    doctor_name,
    patientDetails,
    delivery_details,
    userId,
  } = requestData;

  if (!userId) {
    logger.error("user_id is undefined in labtest-prescriptionupload API");
    return response.status(400).json({
      error: true,
      message: "user_id is required",
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

  let location =
    order_type !== "prescription" ? delivery_location : delivery_location;

  try {
    await prisma.$transaction(async (prisma) => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const lastTwoDigits = year.toString().slice(-2);
      const to_num = "LO";
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);

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
      const datetime = getCurrentDateInIST();

      // Creating lab test order
      const test_order = await prisma.labtest_order.create({
        data: {
          order_number: order_number,
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

      // Handling prescription image upload
      if (order_type === "prescription") {
        const prescription_image = request.files;
        let imageprescription = {};

        if (!prescription_image || prescription_image.length === 0) {
          response.status(400).json({
            success: false,
            error: true,
            message: "Please attach at least one report",
          });
        }

        for (let i = 0; i < prescription_image?.length; i++) {
          let keyName = `image${i + 1}`;
          imageprescription[keyName] = prescription_image[i].location;
        }

        await prisma.labtest_order.update({
          where: { order_id: test_order.order_id },
          data: {
            prescription_image: imageprescription,
            created_date: datetime,
          },
        });
      }

      response.status(200).json({
        success: true,
        message: "Prescription submitted.",
      });
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-prescriptionupload API`
    );
    response.status(500).json({
      error: true,
      message: error.message || "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

//////////////create prescription order////////////////
const prescriptionorder = async (request, response) => {
  console.log("presssssssssss===============================", request.body);
  const datetime = getCurrentDateInIST();
  try {
    const { order_id, total_amount, userId, doctor_name } = request.body;
    const test_details = request.body.order_details;
    console.log({ test_details });
    if (!order_id || !test_details || !userId) {
      return response.status(400).json({ error: "All fields are required" });
    }

    const total_amount_fixed = total_amount
      ? parseFloat(total_amount).toFixed(2)
      : null;

    await prisma.$transaction(async (prisma) => {
      const updatesales = await prisma.labtest_order.update({
        where: {
          order_id,
        },
        data: {
          doctor_name,
          status: "confirmed",
          total_amount: total_amount_fixed,
          updated_date: datetime,
        },
      });

      for (const test of test_details) {
        const { id, name, type, test_number, mrp } = test;

        await prisma.labtest_list.create({
          data: {
            labtest_order: {
              connect: {
                order_id: order_id,
              },
            },
            test_number: test_number,
            created_date: datetime,
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
      `Internal server error: ${error.message} in labtest-prescriptioninvoice API`
    );
    response.status(500).json("An error occurred");
  } finally {
    await prisma.$disconnect();
  }
};

const getprods = async (request, response) => {
  try {
    const alltests = await prisma.labtest_details.findMany({
      where: {
        is_active: true,
      },
    });

    const testsWithType = alltests.map((test) => ({
      ...test,
      type: "test",
    }));

    const allpackages = await prisma.lab_packages.findMany({
      where: {
        is_active: true,
      },
    });

    const packagesWithType = allpackages.map((pkg) => ({
      ...pkg,
      type: "package",
    }));

    const respdata = [...testsWithType, ...packagesWithType];

    return response.status(200).json({
      data: respdata,
      success: true,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-for inv getprods API`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};


const editOrderDetails = async(request,response)=>{
  console.log("req-------",request)
try{
  const{id,
       name,
       gender,
       contact_no,
       test_collection,
       total_amount,
       delivery_details
  } = request.body
  
  const existingOrder = await prisma.labtest_order.findUnique({
    where: { 
      order_id: id,
      // status:"placed"
    },
    select: { 
      patient_details: true ,
      delivery_details:true
    }, 
  });

  if (!existingOrder) {
    return response.status(404).json({
      error: true,
      message: "Order not found",
    });
  }

  let updatePatient = existingOrder.patient_details || {}
  updatePatient.name = name || updatePatient.name 
  updatePatient.gender = gender || updatePatient.gender



  let deliveryLocation = existingOrder.delivery_details || {}
  deliveryLocation.address = delivery_details ||deliveryLocation.address

  const editData = await prisma.labtest_order.update({
    where:{
      order_id:id
    },
    data:{
     contact_no:contact_no || existingOrder.contact_no,
     test_collection: test_collection || existingOrder.test_collection,
     total_amount:total_amount || existingOrder.total_amount,
     delivery_details:deliveryLocation,
     patient_details:updatePatient
    }
  })
  console.log({editData})
  response.status(200).json({
    error:false,
    success:true,
    data:editData,
    message:"Successfully edited the data"
  })
}catch (error) {
  console.log({error})
    logger.error(
      `Internal server error: ${error.message} in labtest-for inv editOrderDetails API`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
}



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
  getallpktests,
  labupdate,
  assignflebo,
  getphelboassists,
  prescriptionupload,
  prescriptionorder,
  getprods,
  editOrderDetails
};
