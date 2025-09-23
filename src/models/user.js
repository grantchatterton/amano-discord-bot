export default (sequelize, DataTypes) => {
	return sequelize.define("User", {
		userId: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		trackMessages: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
	});
};
