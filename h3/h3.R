B = c(2, 3, 0)
C = c(8, 12, 0)
D = c(6, 9, 0) # not a vertex
Na = c(-0.5, -0.3, 0)
Nc = c(0.9, 0.5, 0)
Nf = c(-1, -1, 0)
Ng = c(1, -1, 0)
#eye point
E = c(1,-2,0)
#light position
L = c(-1,0,0)
#ambient light color
Ia = c(0.5, 0.1, 0.5)
#light color
Il = c(0.9, 1, 1)
#diffuse material color
kd = c(.3, .8, .2)
#ambient material color
ka = c(.5, .2, .5)
#specular material color
ks = c(0.5, 1, 1)
#shininess exponent
kse = 10

normalize = function(a) a/sqrt(sum(a^2))
dotprod = function(a,b) sum(a*b)

# clip replaces all negative components with 0 and all components > 1 with 1.
clip = function(a) pmin(pmax(a, c(0,0,0)), c(1,1,1))

# problem 1
Nb = normalize((Nf+Ng)/2)
Nb

# problem 2
Iambient = Ia*ka

lb = normalize(L-B)
Idiffuse_b = kd*Il*dotprod(Nb, lb)
Idiffuse_b

vb = normalize(E-B)
rb = 2*Nb*dotprod(Nb, lb)-lb
Ispecular_b = ks*Il*dotprod(vb, normalize(rb))^kse
Ispecular_b

Itotal_b = clip(Iambient) + clip(Idiffuse_b) + clip(Ispecular_b)
Itotal_b

lc = normalize(L-C)
Idiffuse_c = kd*Il*dotprod(normalize(Nc), lc)
Idiffuse_c

vc = normalize(E-C)
rc = 2*normalize(Nc)*dotprod(normalize(Nc), lc)-lc
rc
Ispecular_c = ks*Il*dotprod(vc, normalize(rc))^kse
Ispecular_c

Itotal_c = clip(Iambient) + clip(Idiffuse_c) + clip(Ispecular_c)
Itotal_c

# Since we're using the flat shading model, D is the same as C
Idiffuse_d = Idiffuse_c
Idiffuse_d
Ispecular_d = Ispecular_c
Ispecular_d
Itotal_d = clip(Iambient) + clip(Idiffuse_d) + clip(Ispecular_d)
Itotal_d

# problem 3
# B and C will be the same, since Gouraud shading only affects the normal interpolation.
percent_c = ((D-B)/(C-B))[1]
percent_c

Idiffuse_d = clip(Idiffuse_c)*percent_c + clip(Idiffuse_b)*(1-percent_c)
Idiffuse_d
Ispecular_d = clip(Ispecular_c)*percent_c + clip(Ispecular_b)*(1-percent_c)
Ispecular_d
Itotal_d = clip(Iambient) + Idiffuse_d + Ispecular_d
Itotal_d

# problem 4
# B and C will be the same, since Phong shading only affects the normal interpolation.
Nd = normalize(normalize(Nb)*(1-percent_c) + normalize(Nc)*percent_c)

ld = normalize(L-D)
Idiffuse_d = kd*Il*dotprod(Nd, ld)
Idiffuse_d

vd = normalize(E-D)
rd = 2*normalize(Nd)*dotprod(normalize(Nd), ld)-ld
rd
Ispecular_d = ks*Il*dotprod(vd, normalize(rd))^kse
Ispecular_d

Itotal_d = clip(Iambient) + clip(Idiffuse_d) + clip(Ispecular_d)
Itotal_d
