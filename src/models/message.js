export default (sequelize, DataTypes) => {
	return sequelize.define("Message", {
		guildId: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		mimic: {
			type: DataTypes.TEXT,
		},
	});
};
