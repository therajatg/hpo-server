import sql from "mssql";

export default class Database {
  config = {};
  poolconnection = null;
  connected = false;

  constructor(config) {
    this.config = config;
    // console.log(`Database: config: ${JSON.stringify(config)}`);
  }

  async connect() {
    try {
      console.log(`Database connecting...${this.connected}`);
      if (this.connected === false) {
        this.poolconnection = await sql.connect(this.config);
        this.connected = true;
        console.log("Database connection successful");
      } else {
        console.log("Database already connected");
      }
    } catch (error) {
      console.error(`Error connecting to database: ${JSON.stringify(error)}`);
    }
  }

  async disconnect() {
    try {
      this.poolconnection.close();
      console.log("Database connection closed");
    } catch (error) {
      console.error(`Error closing database connection: ${error}`);
    }
  }

  async executeQuery(query) {
    await this.connect();
    const request = this.poolconnection.request();
    const result = await request.query(query);

    return result.rowsAffected[0];
  }

  async create(data) {
    await this.connect();
    const request = this.poolconnection.request();

    request.input("firstName", sql.NVarChar(255), data.firstName);
    request.input("lastName", sql.NVarChar(255), data.lastName);

    const result = await request.query(
      `INSERT INTO Person (firstName, lastName) VALUES (@firstName, @lastName)`
    );

    return result.rowsAffected[0];
  }

  async readAll() {
    await this.connect();
    const request = this.poolconnection.request();
    const result = await request.query(`SELECT * FROM Person`);

    return result.recordsets[0];
  }

  async read(searchText) {
    await this.connect();
    const request = this.poolconnection.request();

    if (searchText.toLowerCase().includes("or")) {
      const searchTextArr = searchText
        .toLowerCase()
        .split(" or ")
        .map((text) => text.trim());
      const termCondition = searchTextArr
        .map(
          (term) =>
            `(HP_Terms LIKE '%${term}%' OR Description LIKE '%${term}%')`
        )
        .join(" OR ");

      const diseaseCondition = searchTextArr
        .map(
          (disease) =>
            `(disease_id LIKE '%${disease}%' OR disease_name LIKE '%${disease}%')`
        )
        .join(" OR ");

      const termsResult = await request.query(
        `SELECT * FROM term WHERE ${termCondition}`
      );
      const diseaseResult = await request.query(
        `SELECT * FROM disease WHERE ${diseaseCondition}`
      );

      return {
        termData: termsResult.recordset,
        diseaseData: diseaseResult.recordset,
      };
    }

    if (searchText.toLowerCase().includes("and")) {
      const searchTextArr = searchText
        .toLowerCase()
        .split(" and ")
        .map((text) => text.trim());
      const termCondition = searchTextArr
        .map(
          (term) =>
            `(HP_Terms LIKE '%${term}%' OR Description LIKE '%${term}%')`
        )
        .join(" AND ");

      const diseaseCondition = searchTextArr
        .map(
          (disease) =>
            `(disease_id LIKE '%${disease}%' OR disease_name LIKE '%${disease}%')`
        )
        .join(" AND ");

      const termsResult = await request.query(
        `SELECT * FROM term WHERE ${termCondition}`
      );
      const diseaseResult = await request.query(
        `SELECT * FROM disease WHERE ${diseaseCondition}`
      );

      return {
        termData: termsResult.recordset,
        diseaseData: diseaseResult.recordset,
      };
    }

    const termsResult = await request.query(
      `SELECT * FROM term WHERE HP_Terms LIKE '%${searchText}%' OR Description LIKE '%${searchText}%'`
    );
    const diseaseResult = await request.query(
      `SELECT * FROM disease WHERE disease_id LIKE '%${searchText}%' OR disease_name LIKE '%${searchText}%'`
    );
    return {
      termData: termsResult.recordset,
      diseaseData: diseaseResult.recordset,
    };
  }

  async update(id, data) {
    await this.connect();

    const request = this.poolconnection.request();

    request.input("id", sql.Int, +id);
    request.input("firstName", sql.NVarChar(255), data.firstName);
    request.input("lastName", sql.NVarChar(255), data.lastName);

    const result = await request.query(
      `UPDATE Person SET firstName=@firstName, lastName=@lastName WHERE id = @id`
    );

    return result.rowsAffected[0];
  }

  async delete(id) {
    await this.connect();

    const idAsNumber = Number(id);

    const request = this.poolconnection.request();
    const result = await request
      .input("id", sql.Int, idAsNumber)
      .query(`DELETE FROM Person WHERE id = @id`);

    return result.rowsAffected[0];
  }
}
