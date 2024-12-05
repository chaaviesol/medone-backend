const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");
require("dotenv").config();

////////////////get products of pharmacy///////////////

const getproductspharmacy = async (request, response) => {
  try {
    const { pharmacy_id } = request.body;

    if (!pharmacy_id) {
      return response.status(400).json({
        error: true,
        message: "pharmacy_id can't be null or empty.",
      });
    }

    
    const pharmacyMedicines = await prisma.pharmacy_medicines.findFirst({
      where: {
        pharmacy_id: pharmacy_id,
      },
      select: {
        pharmacy_id: true,
        product_ids: true,
        created_date: true,
      },
    });

    if (!pharmacyMedicines) {
      return response.status(404).json({
        success: false,
        error: true,
        message: "No medicines found for the provided pharmacy_id.",
      });
    }

    const productIds = pharmacyMedicines.product_ids;
    const products = [];

    // Fetch details for each product ID
    for (const productId of productIds) {
      const product = await prisma.generic_product.findFirst({
        where: {
          id: productId,
        },
      });
      if (product) {
        products.push(product);
      }
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Products retrieved successfully.",
      data: {
        pharmacy_id: pharmacyMedicines.pharmacy_id,
        products,
      },
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacyquotation-getproducts API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};


///////////////////product ///////////////////

// const getpharmacies = async (request, response) => {
//   try {
//     let { pincode, product_ids,sales_id } = request.body;

//     if (!pincode || !product_ids) {
//       return response.status(400).json({
//         error: true,
//         message: "pincode and product_ids can't be null or empty.",
//       });
//     }

//     pincode = parseInt(pincode);

//     if (isNaN(pincode)) {
//       return response.status(400).json({
//         error: true,
//         message: "Invalid pincode provided.",
//       });
//     }

//     let pharmacies = await prisma.pharmacy_details.findMany({
//       where: { pincode: pincode },
//     });

//     let range = 1; // Initialize search range
//     while (pharmacies.length < 3) {
//       const incrementPincode = pincode + range;
//       const decrementPincode = pincode - range;

//       console.log(`Searching pincodes: ${incrementPincode} and ${decrementPincode}`);

//       const nearestPharmacies = await prisma.pharmacy_details.findMany({
//         where: {
//           OR: [
//             { pincode: incrementPincode },
//             { pincode: decrementPincode },
//           ],
//         },
//       });

//       // Add unique pharmacies to the list
//       pharmacies = [...new Map([...pharmacies, ...nearestPharmacies].map(p => [p.id, p])).values()];
//       if (nearestPharmacies.length === 0) {
//         console.log(`No pharmacies found for range ${range}. Expanding search.`);
//       }
//       range++;
//       if (range > 100) break;
//     }
//    // Limit to 3 pharmacies
//    pharmacies = pharmacies.slice(0, 3);

//    // Check product availability and add count
//    for (let pharmacy of pharmacies) {
//      const products = await prisma.pharmacy_medicines.findFirst({
//        where: { pharmacy_id: pharmacy.id },
//        select: { product_ids: true },
//      });

//      const availableProducts = products?.product_ids || [];
//      const matchingCount = product_ids.filter(pid => availableProducts.includes(pid)).length;

//      pharmacy.count = matchingCount;
//    }

//     return response.status(200).json({
//       data: pharmacies,
//       success: true,
//       error: false,
//     });
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in pharmacy-assignpharmacy API`
//     );
//     console.error(error);
//     response.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

const getpharmacies = async (request, response) => {
  try {
    let { sales_id } = request.body;

    if (!sales_id) {
      return response.status(400).json({
        error: true,
        message: "pincode and product_ids can't be null or empty.",
      });
    }
    const finddata = await prisma.sales_order.findUnique({
      where: {
        sales_id: sales_id,
      },
      select: {
        pincode: true,
        so_status: true,
        sales_list: {
          select: {
            product_id: true,
          },
        },
        pharmacyquotation: {
          select: {
            pharm_id: {
              select: {
                id: true,
                name: true,
              },
            },
            status: true,
          },
        },
      },
    });

    if (
      Array.isArray(finddata.pharmacyquotation) &&
      finddata.pharmacyquotation.length > 0
    ) {
      return response.status(200).json({
        success: true,
        data: finddata.pharmacyquotation,
      });
    }

    pincode = finddata.pincode;
    const product_ids =
      finddata?.sales_list.map((item) => item.product_id) || [];

    if (isNaN(pincode)) {
      return response.status(400).json({
        error: true,
        message: "Invalid pincode provided.",
      });
    }

    let pharmacies = await prisma.pharmacy_details.findMany({
      where: { pincode: pincode },
    });

    let range = 1; // Initialize search range
    while (pharmacies.length < 3) {
      const incrementPincode = pincode + range;
      const decrementPincode = pincode - range;

      console.log(
        `Searching pincodes: ${incrementPincode} and ${decrementPincode}`
      );

      const nearestPharmacies = await prisma.pharmacy_details.findMany({
        where: {
          OR: [{ pincode: incrementPincode }, { pincode: decrementPincode }],
        },
      });

      // Add unique pharmacies to the list
      pharmacies = [
        ...new Map(
          [...pharmacies, ...nearestPharmacies].map((p) => [p.id, p])
        ).values(),
      ];
      if (nearestPharmacies.length === 0) {
        console.log(
          `No pharmacies found for range ${range}. Expanding search.`
        );
      }
      range++;
      if (range > 100) break;
    }
    // Limit to 3 pharmacies
    pharmacies = pharmacies.slice(0, 3);

    // Check product availability and add count
    for (let pharmacy of pharmacies) {
      const products = await prisma.pharmacy_medicines.findFirst({
        where: { pharmacy_id: pharmacy.id },
        select: { product_ids: true },
      });

      const availableProducts = products?.product_ids || [];
      const matchingCount = product_ids.filter((pid) =>
        availableProducts.includes(pid)
      ).length;

      pharmacy.count = matchingCount;
    }

    return response.status(200).json({
      data: pharmacies,
      success: true,
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy-assignpharmacy API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

///////////assign pharmacy/////////////////
const assignpharmacy = async (request, response) => {
  try {
    let { sales_id, pharmacy_id, status } = request.body;

    const datetime = getCurrentDateInIST();

    // Validate the required fields
    if (!sales_id || pharmacy_id) {
      return response.status(400).json({
        error: true,
        message: "sales_id and pharmacy_id can't be null or empty.",
      });
    }

    const add = await prisma.pharmacyquotation.create({
      data: {
        status: status,
        sales_id: sales_id,
        pharmacy_id: pharmacy_id,
        created_date: datetime,
        Stmodified_date: datetime,
      },
    });

    if (add) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Pharmacy assigned successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy-assignpharmacy API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getpackedorders = async (request, response) => {
  try {
    const allorders = await prisma.pharmacyquotation.findMany({
      where: {
        status: "packed",
      },
    });
    if (allproducts.length > 0) {
      return response.status(200).json({
        data: allorders,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacyquotation getpackedorders from pharmacy API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { assignpharmacy, getpackedorders, getpharmacies ,getproductspharmacy};
