const {
  decrypt,
  getCurrentDateInIST,
  istDate,
  logger,
  prisma,
} = require("../../utils");
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
      `Internal server error: ${error.message} in pharmacy_assign-getproducts API`
    );
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

///////////////////product ///////////////////

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
        pharmacy_assign: {
          select: {
            pharm_id: {
              select: {
                id: true,
                name: true,
                address: true,
                pincode: true,
              },
            },
            status: true,
          },
        },
      },
    });

    if (
      finddata &&
      (finddata.so_status === "Placed" || finddata.so_status === "placed")
    ) {
      return response.status(200).json({
        data: [],
        message: "Assignment not allowed. Please bill first.",
      });
    }

    if (
      Array.isArray(finddata.pharmacy_assign) &&
      finddata.pharmacy_assign.length > 0
    ) {
      return response.status(200).json({
        success: true,
        data: finddata.pharmacy_assign,
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

    let pharmacies = await prisma.pharmacy_details.findMany({});

    // let range = 1; // Initialize search range
    // while (pharmacies.length < 3) {
    //   const incrementPincode = pincode + range;
    //   const decrementPincode = pincode - range;

    //   console.log(
    //     `Searching pincodes: ${incrementPincode} and ${decrementPincode}`
    //   );

    //   const nearestPharmacies = await prisma.pharmacy_details.findMany({
    //     where: {
    //       OR: [{ pincode: incrementPincode }, { pincode: decrementPincode }],
    //     },
    //     select: {
    //       id: true,
    //       name: true,
    //       address: true,
    //       pincode: true,
    //     },
    //   });

    //   // Add unique pharmacies to the list
    //   pharmacies = [
    //     ...new Map(
    //       [...pharmacies, ...nearestPharmacies].map((p) => [p.id, p])
    //     ).values(),
    //   ];
    //   if (nearestPharmacies.length === 0) {
    //     // console.log(
    //     //   `No pharmacies found for range ${range}. Expanding search.`
    //     // );
    //   }
    //   range++;
    //   // if (range > 100) break;
    // }
    // // Limit to 3 pharmacies
    // pharmacies = pharmacies.slice(0, 3);
    const givenPincode = pincode;
    function findNearestPinCodes(pharmacies, givenPincode, count = 3) {
      pharmacies.sort(
        (a, b) =>
          Math.abs(a.pincode - givenPincode) -
          Math.abs(b.pincode - givenPincode)
      );

      return pharmacies.slice(0, count);
    }

    const nearestPharmacies = findNearestPinCodes(pharmacies, givenPincode);

    // // Check product availability and add count
    // for (let pharmacy of pharmacies) {
    //   const products = await prisma.pharmacy_medicines.findFirst({
    //     where: { pharmacy_id: pharmacy.id },
    //     select: { product_ids: true },
    //   });
    const productDetails = await Promise.all(
      nearestPharmacies.map(async (pharmacy) => {
        const products = await prisma.pharmacy_medicines.findFirst({
          where: { pharmacy_id: pharmacy.id },
          select: { product_ids: true },
        });
        const availableProducts = products?.product_ids || [];
        const matchingCount = product_ids.filter((pid) =>
          availableProducts.includes(pid)
        ).length;

        return {
          pharm_id: {
            id: pharmacy.id,
            name: pharmacy.name,
            address: pharmacy.address,
            pincode: pharmacy.pincode,
          },
          status: "",
          matchingCount,
        };
      })
    );
    return response.status(200).json({
      data: productDetails,
      success: true,
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy-assignpharmacy API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

///////////assign pharmacy/////////////////
const assignpharmacy = async (request, response) => {
  try {
    const { sales_id, pharmacy_id, status } = request.body;
    const datetime = getCurrentDateInIST();

    // Validate the required fields
    if (!sales_id || !pharmacy_id) {
      return response.status(400).json({
        error: true,
        message: "sales_id and pharmacy_id can't be null or empty.",
      });
    }

    const add = await prisma.pharmacy_assign.create({
      data: {
        status: status,
        sales_id: sales_id,
        pharmacy_id: pharmacy_id,
        created_date: datetime,
        Stmodified_date: datetime,
      },
    });
    const update = await prisma.sales_order.update({
      where: {
        sales_id: sales_id,
      },
      data: {
        pharmacy_id: pharmacy_id,
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
      `Internal server error: ${error.message} in pharmacy_assign-assignpharmacy API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getpackedorders = async (request, response) => {
  try {
    const allorders = await prisma.pharmacy_assign.findMany({
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
      `Internal server error: ${error.message} in  getpackedorders- pharmacy_assign API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

////////get ordered details/////////////////
const getorderdetailsss = async (request, response) => {
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
            product_id: true,
            order_qty: true,
            net_amount: true,
            selling_price: true,
            batch_no: true,
            generic_prodid: {
              select: {
                name: true,
              },
            },
          },
        },
        medicine_timetable: true,
       
      },
    });

    let user_name = null;
    if (getdata?.users?.name) {
      user_name = decrypt(getdata.users.name, secretKey);
    }
    if (getdata.length > 0) {
      const salesInvoice = await Promise.all(
        getdata.medicine_timetable.map(
          async (item, index) => {
            const detailedMedicines = await Promise.all(
              (item.medicine || []).map(async (medicine, medIndex) => {
                const medicinedetails = await prisma.sales_list.findFirst({
                  where: { product_id: medicine.id, sales_id: sales_id },
                  select: {
                    order_qty: true,
                    net_amount: true,
                    batch_no: true,
                    selling_price: true,
                    generic_prodid: {
                      select: {
                        hsn: true,
                        mrp: true,
                      },
                    },
                  },
                });

                return {
                  ...medicine,
                  details: medicinedetails,
                };
              })
            );

            return {
              ...item,
              medicine: detailedMedicines,
            };
          }
        )
      );

      response.status(200).json({
        success: true,
        data: {
          ...getdata,
          sales_invoice: salesInvoice,
          user_name,
        },
      });
    } else {
      response.status(200).json({
        success: true,
        data: {
          ...getdata,
          sales_invoice: getdata.sales_list,
          user_name,
        },
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy_assign-getorderdetails API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getorderdetails = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const sales_id = request.body.sales_id;
    if (!sales_id) {
      return response.status(400).json({
        message: "sales_id can't be null",
        error: true,
      });
    }

    // Fetch sales order data
    const getdata = await prisma.sales_order.findUnique({
      where: { sales_id: sales_id },
      select: {
        sales_id: true,
        so_number: true,
        so_status: true,
        order_type: true,
        remarks: true,
        users: {
          select: { id: true, name: true },
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
        updated_date: true,
        sales_list: {
          select: {
            product_id: true,
            order_qty: true,
            net_amount: true,
            selling_price: true,
            batch_no: true,
            generic_prodid: {
              select: { id: true, name: true, hsn: true, mrp: true },
            },
          },
        },
        // sales_invoice: {
        //   select: {
        //     created_date: true,
            medicine_timetable: {
              select: {
                medicine: true,
                medicine_type: true,
                no_of_days: true,
                afterFd_beforeFd: true,
                totalQuantity: true,
                timing: true,
                timeInterval: true,
                takingQuantity: true,
                daysInterval: true,
              },
            },
          // },
        // },
      },
    });

    if (!getdata) {
      return response.status(404).json({
        message: "Sales order not found",
        error: true,
      });
    }

    // Decrypt user name if available
    let user_name = null;
    if (getdata?.users?.name) {
      user_name = decrypt(getdata.users.name, secretKey);
    }

    // Combine sales_list and medicine_timetable
    const medicineTimetables =
      getdata.medicine_timetable || [];
    const combinedProducts = getdata.sales_list.map((product) => {
      const matchingMedicine = medicineTimetables.find((timetable) =>
        timetable.medicine.some((med) => med.id === product.generic_prodid.id)
      );

      return matchingMedicine
        ? {
            ...product,
            generic_prodid: {
              ...product.generic_prodid,
              medicine_timetable: matchingMedicine,
            },
          }
        : product;
    });
    const packed = await prisma.pharmacy_assign.findFirst({
      where: {
        sales_id: sales_id,
      },
      select: {
        Stmodified_date: true,
      },
    });

    response.status(200).json({
      success: true,
      data: {
        sales_id: getdata.sales_id,
        so_number: getdata.so_number,
        so_status: getdata.so_status,
        order_type: getdata.order_type,
        remarks: getdata.remarks,
        contact_no: getdata.contact_no,
        created_date: getdata.created_date,
        updated_date: getdata.updated_date,
        delivery_address: getdata.delivery_address,
        doctor_name: getdata.doctor_name,
        city: getdata.city,
        district: getdata.district,
        pincode: getdata.pincode,
        prescription_image: getdata.prescription_image,
        patient_name: getdata.patient_name,
        products: combinedProducts,
        packedDate: packed?.Stmodified_date || "",
        user_name,
      },
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy_assign-getorderdetails API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const myorderstatus = async (request, response) => {
  try {
    const sales_id = request.body.sales_id;

    // Validate sales_id
    if (!sales_id) {
      return response.status(400).json({
        message: "sales_id can't be null",
        error: true,
      });
    }

    // Fetch sales order data
    const getdata = await prisma.sales_order.findUnique({
      where: { sales_id: sales_id },
      select: {
        so_status: true,
        created_date: true,
        updated_date: true,
      },
    });

    // Validate if sales order exists
    if (!getdata) {
      return response.status(404).json({
        message: "Sales order not found",
        error: true,
      });
    }

    const { so_status, created_date, updated_date } = getdata;
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
    } else if (so_status === "packed" || so_status === "shipped" || so_status === "delivered") {
      const packedData = await prisma.pharmacy_assign.findFirst({
        where: { sales_id: sales_id },
        select: { Stmodified_date: true },
      });

      if (!packedData) {
        return response.status(404).json({
          message: "Packed details not found",
          error: true,
        });
      }

      data = {
        ...data,
        confirmed: true,
        confirmedDate: updated_date,
        packed: true,
        packedDate: packedData.Stmodified_date,
      };

      if (so_status === "shipped" || so_status === "delivered") {
        const deliveryAgent = await prisma.deliveryassign.findFirst({
          where: { sales_id: sales_id },
          select: {
            status: true,
            assigned_date: true,
            delivered_date: true,
          },
        });

        if (!deliveryAgent) {
          return response.status(404).json({
            message: "Delivery details not found",
            error: true,
          });
        }

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
        } else {
          data.delivered = false;
          data.deliveryDate = null;
        }
      }
    }

    return response.status(200).json({
      data,
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy_assign-myorderstatus API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};


/////////////////////delivery partner///////////////////////

const assigndeliverypartner = async (request, response) => {
  try {
    const { sales_id, deliverypartner_id, status } = request.body;
    const datetime = getCurrentDateInIST();

    // Validate the required fields
    if (!sales_id || !deliverypartner_id) {
      return response.status(400).json({
        error: true,
        message: "sales_id and deliverypartner_id can't be null or empty.",
      });
    }

    const add = await prisma.delivery_assign.create({
      data: {
        status: status,
        sales_id: sales_id,
        deliverypartner_id: deliverypartner_id,
        assigned_date: datetime,
        
      },
    });
    
    if (add) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Delivery partner assigned successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in pharmacy_assign-assigndeliverypartner API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  assignpharmacy,
  getpackedorders,
  getpharmacies,
  getproductspharmacy,
  getorderdetails,
  getorderdetailsss,
  myorderstatus,
  assigndeliverypartner
};
