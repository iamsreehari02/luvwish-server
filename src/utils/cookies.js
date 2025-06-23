export const setAuthCookie = (res, token) => {
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
