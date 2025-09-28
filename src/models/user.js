export default (sequelize, DataTypes) => {
	return sequelize.define("User", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		trackMessages: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
	});
};
