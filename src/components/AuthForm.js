import React, { useRef, useState } from "react";
import { FiArrowRight, FiLock } from "react-icons/fi";
import { AuthCard } from "../App.styles";
import { Button, Field, Label, Input, Hint, FieldError, Muted } from "../styles/ui";

export default function AuthForm({ register, busy, refreshing, onSubmit, onToggle }) {
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const submit = event => {
    event.preventDefault();
    const form = event.currentTarget;
    const next = {};
    if (register && form.elements.displayName.value.trim().length < 2) next.displayName = "Informe um nome com pelo menos 2 caracteres.";
    if (!form.elements.email.value.trim() || form.elements.email.validity.typeMismatch) next.email = "Informe um e-mail válido.";
    if (!form.elements.password.value) next.password = "Informe sua senha.";
    else if (register && form.elements.password.value.length < 12) next.password = "Use pelo menos 12 caracteres.";
    setErrors(next);
    if (Object.keys(next).length) { form.elements[Object.keys(next)[0]].focus(); return; }
    onSubmit(event);
  };
  const clear = name => setErrors(previous => ({ ...previous, [name]: "" }));
  return <AuthCard aria-labelledby="auth-title">
    <div><h2 id="auth-title">{register ? "Crie sua conta" : "Bem-vindo de volta"}</h2>
      <Muted>{register ? "Um lugar para organizar suas finanças." : "Entre para acompanhar suas finanças."}</Muted></div>
    <form ref={formRef} onSubmit={submit} noValidate aria-label={register ? "Cadastro" : "Login"}>
      {register && <Field>
        <Label htmlFor="auth-name">Nome</Label>
        <Input id="auth-name" name="displayName" required minLength={2} maxLength={100} autoComplete="name"
          placeholder="Como você quer ser chamado?" disabled={busy} aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? "name-error" : undefined} onChange={() => clear("displayName")} />
        {errors.displayName && <FieldError id="name-error" role="alert">{errors.displayName}</FieldError>}
      </Field>}
      <Field><Label htmlFor="auth-email">E-mail</Label>
        <Input id="auth-email" name="email" type="email" inputMode="email" autoCapitalize="none"
          required maxLength={254} autoComplete="username" placeholder="voce@exemplo.com" disabled={busy}
          aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined}
          onChange={() => clear("email")} />
        {errors.email && <FieldError id="email-error" role="alert">{errors.email}</FieldError>}
      </Field>
      <Field><Label htmlFor="auth-password">Senha</Label>
        <Input id="auth-password" name="password" type="password" required maxLength={128}
          minLength={register ? 12 : undefined} autoComplete={register ? "new-password" : "current-password"}
          disabled={busy} aria-invalid={!!errors.password}
          aria-describedby={[register && "password-hint", errors.password && "password-error"].filter(Boolean).join(" ") || undefined}
          onChange={() => clear("password")} />
        {errors.password && <FieldError id="password-error" role="alert">{errors.password}</FieldError>}
        {register && <Hint id="password-hint">Use pelo menos 12 caracteres, incluindo maiúscula, minúscula, número e símbolo.</Hint>}
      </Field>
      <Button disabled={busy || refreshing} type="submit">
        {busy ? "Aguarde..." : register ? "Cadastrar e entrar" : "Entrar"}<FiArrowRight aria-hidden="true" />
      </Button>
      <Button $variant="secondary" type="button" disabled={busy} onClick={() => { setErrors({}); onToggle(); }}>
        {register ? "Já tenho conta" : "Criar conta"}
      </Button>
    </form>
    <Hint><FiLock aria-hidden="true" /> Seus dados financeiros ficam na sua conta.</Hint>
  </AuthCard>;
}
