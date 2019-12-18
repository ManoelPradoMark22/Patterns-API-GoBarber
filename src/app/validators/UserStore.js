import * as Yup from 'yup';

/* iremos exportar uma fç responsável por fazer a validação.
essa fç vai ser um middleware do express. */
export default async (req, res, next) => {
  try {
    /* object() pq estamos validando um objeto (o req.body é um objeto)
    e em seguida passamos o fomato q queremos q esse objeto tenha */
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    await schema.validate(req.body, { abortEarly: false });

    /* se a validacao acima passar, chamamos o nosso controller com o next() */
    return next();
  } catch (err) {
    return res
      .status(400)
      .json({ error: 'Validation fails', messages: err.inner });
    /* messages: err.inner --> no inner é onde esta as msgs de erro da nossa validacao */
  }
};
