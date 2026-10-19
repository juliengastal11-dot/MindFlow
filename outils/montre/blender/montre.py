# La montre Stalika qui se fabrique, dans Blender (sans fenêtre). Le mode d'emploi est dans ../LISEZMOI.md.
# Avant : python cadran.py, python cuir.py, python mouvement-texture.py (les textures). Tout en millimètres, l'axe de la montre est Z (le cadran
# regarde +Z), midi est +Y, la couronne +X. Les pièces sont construites à leur place dans la montre finie ; l'éclaté les
# écarte le long de l'axe (ou de leur propre axe pour la couronne et les bracelets), et chacune revient se poser pendant
# son étape. La caméra, de trois quarts au-dessus, se relève et s'approche à la fin.
#   blender -b -P montre.py -- test <sortie> <p1,p2,...> [largeur hauteur echantillons]
#   blender -b -P montre.py -- rendu <dossier> <n images> <de> <a> [largeur hauteur echantillons]
import bpy, bmesh, sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import atelier as A
from mathutils import Vector, Matrix, Euler

ICI = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(ICI, "textures")
MVT_GLB = os.path.join(ICI, "mouvement-tripo.glb")

# --- les cotes (celles de la montre 3D d'avant, lib/montre-3d.ts) ----------------------------------------------------
R_BOITE = 19.1
R_CADRAN = 15.6
Z_CADRAN = 4.3          # le dessous du cadran (son dessus à 4.7)
E_CADRAN = 0.4
Z_REHAUT = 5.3
R_MVT = 12.25
Z_MVT = (0.1, 4.3)

PROFIL_FOND = [(12.9, -0.55), (13.25, -0.5), (13.5, -0.36), (13.9, -0.26), (17.5, -0.26), (17.85, -0.2), (18.25, 0.02)]
PROFIL_CARRURE = [(18.25, 0.02), (18.65, 0.4), (18.98, 0.95), (19.1, 1.7), (19.1, 4.0), (19.06, 4.75)]
PROFIL_LUNETTE = [(19.06, 4.75), (18.95, 5.3), (18.75, 5.82), (18.3, 6.08), (17.6, 6.12), (16.8, 5.95), (15.95, 5.52), (15.65, 5.3), (15.65, 4.75)]

def lisse(t):
    return t * t * (3 - 2 * t)

def borne(x):
    return min(1.0, max(0.0, x))

# --- construction ----------------------------------------------------------------------------------------------------
def maillage(nom, verts, faces, mat=None, uvs=None, angle=35):
    me = bpy.data.meshes.new(nom)
    me.from_pydata(verts, [], faces)
    me.update()
    if uvs is not None:
        uv = me.uv_layers.new(name="UV")
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index
                uv.data[li].uv = uvs[vi]
    o = bpy.data.objects.new(nom, me)
    bpy.context.scene.collection.objects.link(o)
    if mat: me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    if angle is not None and hasattr(me, "set_sharp_from_angle"):
        me.set_sharp_from_angle(angle=math.radians(angle))
    return o

def tour(nom, profil, mat, segments=192, fermer=True, uv_v=None, angle=35):
    """Un profil (rayon, z) tourné autour de Z. `fermer` : le profil est un contour fermé (solide)."""
    n = len(profil)
    verts = []; uvs = []
    for i in range(segments):
        a = 2 * math.pi * i / segments
        c, s = math.cos(a), math.sin(a)
        for k, (r, z) in enumerate(profil):
            verts.append((r * c, r * s, z))
            uvs.append((i / segments, k / max(1, n - 1) if uv_v is None else uv_v[k]))
    faces = []
    m = n if fermer else n - 1
    for i in range(segments):
        j = (i + 1) % segments
        for k in range(m):
            k2 = (k + 1) % n
            a, b, c, d = i * n + k, i * n + k2, j * n + k2, j * n + k
            if profil[k][0] < 1e-6 and profil[k2][0] < 1e-6: continue
            if profil[k][0] < 1e-6: faces.append((a, c, d))
            elif profil[k2][0] < 1e-6: faces.append((a, b, d))
            else: faces.append((a, b, c, d))
    o = maillage(nom, verts, faces, mat, uvs, angle)
    if fermer:
        bm = bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(o.data); bm.free()
    return o

def disque(nom, r, z, mat, segments=192, uv=True, vers_bas=False):
    verts = [(0, 0, z)] + [(r * math.cos(2 * math.pi * i / segments), r * math.sin(2 * math.pi * i / segments), z) for i in range(segments)]
    faces = []
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((0, 1 + j, 1 + i) if vers_bas else (0, 1 + i, 1 + j))
    uvs = [(0.5 + v[0] / (2 * r), 0.5 + v[1] / (2 * r)) for v in verts] if uv else None
    return maillage(nom, verts, faces, mat, uvs, angle=None)

def extruder(nom, contour, z0, z1, mat, biseau=0.0, segments_biseau=3, angle=35):
    """Un contour 2D (x, y) extrudé de z0 à z1, arêtes biseautées."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z0)) for x, y in contour]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    haut = [g for g in r["geom"] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, z1 - z0), verts=haut)
    bm.normal_update()
    if biseau > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=biseau, segments=segments_biseau, profile=0.5, affect="EDGES")
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nom, me); bpy.context.scene.collection.objects.link(o)
    if mat: me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    if hasattr(me, "set_sharp_from_angle"): me.set_sharp_from_angle(angle=math.radians(angle))
    return o

def bezier(p0, p1, p2, p3, n):
    out = []
    for i in range(n + 1):
        t = i / n
        out.append(((1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0],
                    (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1]))
    return out

def contour_corne():
    """Le profil de côté d'une corne (distance au centre, hauteur), comme avant."""
    pts = [(13.6, 4.85)]
    pts += bezier((13.6, 4.85), (19.0, 4.95), (22.0, 4.2), (23.6, 2.95), 16)[1:]
    # quadratique (23.6,2.95) -> (24.25,2.35) -> (23.95,1.75)
    q0, q1, q2 = (23.6, 2.95), (24.25, 2.35), (23.95, 1.75)
    for i in range(1, 7):
        t = i / 6
        pts.append(((1 - t) ** 2 * q0[0] + 2 * (1 - t) * t * q1[0] + t * t * q2[0], (1 - t) ** 2 * q0[1] + 2 * (1 - t) * t * q1[1] + t * t * q2[1]))
    pts.append((23.3, 1.3))
    pts += bezier((23.3, 1.3), (21.8, 1.75), (19.6, 2.15), (13.6, 2.15), 16)[1:]
    return pts

def corne(nom, sx, sy, mat):
    # dessinée en (distance, hauteur) -> (y, z) ; l'épaisseur 2,4 sur x, effilée de 30 % vers le bout
    c = contour_corne()
    bm = bmesh.new()
    vs = [bm.verts.new((-1.2, d, h)) for d, h in c]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    haut = [g for g in r["geom"] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(2.4, 0, 0), verts=haut)
    bm.normal_update()
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.3, segments=3, profile=0.5, affect="EDGES")
    for v in bm.verts:
        t = borne((v.co.y - 17) / 7)
        v.co.x *= 1 - 0.3 * lisse(t)
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nom, me); bpy.context.scene.collection.objects.link(o)
    me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    if hasattr(me, "set_sharp_from_angle"): me.set_sharp_from_angle(angle=math.radians(35))
    o.location = (sx * 11.55, 0, 0)
    o.scale = (1, sy, 1)
    return o

def aiguille(nom, longueur, large, mat, queue=1.6, epaisseur=0.22):
    """Une aiguille dauphine : losange effilé, arête centrale en relief, dessinée vers +Y depuis le pivot."""
    stations = [(-queue, large * 0.45), (0.0, large * 0.5), (longueur * 0.22, large), (longueur * 0.6, large * 0.62), (longueur, 0.06)]
    verts = []; faces = []
    for k, (y, w) in enumerate(stations):
        verts += [(-w / 2, y, 0.0), (0, y, epaisseur), (w / 2, y, 0.0), (0, y, -epaisseur * 0.3)]
        if k > 0:
            b = (k - 1) * 4; c = k * 4
            for e in range(4):
                e2 = (e + 1) % 4
                faces.append((b + e, b + e2, c + e2, c + e))
    faces.append((0, 3, 2, 1)); n = (len(stations) - 1) * 4; faces.append((n, n + 1, n + 2, n + 3))
    return maillage(nom, verts, faces, mat, angle=None)

def brin(nom, sens, arc, mat, largeur=20.0, bout=17.0, epaisseur=3.4, finale=2.6):
    """Un brin de bracelet balayé le long d'une courbe : à plat entre les cornes, puis enroulé vers l'arrière."""
    R = 13.0; sortie = 21.0; z0 = 2.05
    pts = [Vector((0, 16.8 * sens, z0 + 0.05)), Vector((0, 19 * sens, z0 + 0.02))]
    N = 30
    for i in range(N + 1):
        a = math.pi / 2 - arc * i / N
        pts.append(Vector((0, sens * (sortie + R * math.cos(a)), z0 - R + R * math.sin(a))))
    # la courbe lissée (Catmull-Rom centripète approchée par une interpolation cubique uniforme sur points densifiés)
    def catmull(p0, p1, p2, p3, t):
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
    dense = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        for k in range(8):
            dense.append(catmull(P[i - 1], P[i], P[i + 1], P[i + 2], k / 8))
    dense.append(pts[-1])
    # abscisse curviligne
    L = [0.0]
    for i in range(1, len(dense)): L.append(L[-1] + (dense[i] - dense[i - 1]).length)
    total = L[-1]
    def au(t):
        s = t * total
        for i in range(1, len(dense)):
            if L[i] >= s:
                u = (s - L[i - 1]) / max(1e-9, L[i] - L[i - 1])
                p = dense[i - 1].lerp(dense[i], u); tg = (dense[i] - dense[i - 1]).normalized()
                return p, tg
        return dense[-1], (dense[-1] - dense[-2]).normalized()
    ANNEAUX = 100; DESSUS = 16
    verts = []; uvs = []; faces = []
    B = Vector((1, 0, 0))
    m = 2 * DESSUS
    for i in range(ANNEAUX + 1):
        t = i / ANNEAUX
        Pp, T = au(t)
        Nn = (B.cross(T) * sens).normalized()
        w = largeur + (bout - largeur) * t
        e = epaisseur + (finale - epaisseur) * t
        if t > 0.93:
            k = (t - 0.93) / 0.07
            w *= math.sqrt(max(1e-4, 1 - k * k)); e *= 0.6 + 0.4 * math.sqrt(max(0, 1 - k * k))
        section = []
        for j in range(DESSUS + 1):
            x = -w / 2 + w * j / DESSUS; q = 2 * x / w
            bordv = math.sqrt(max(0, 1 - ((abs(q) - 0.86) / 0.14) ** 2)) if abs(q) > 0.86 else 1
            section.append((x, -e / 2 + e * (0.62 + 0.38 * (1 - q * q)) * (0.35 + 0.65 * bordv), 0.03 + 0.94 * (x / w + 0.5)))
        for j in range(DESSUS - 1, 0, -1):
            x = -w / 2 + w * j / DESSUS
            section.append((x, -e / 2, 0.03 + 0.94 * (x / w + 0.5)))
        for (x, y, u) in section:
            v = Pp + B * x + Nn * y
            verts.append((v.x, v.y, v.z)); uvs.append((u, t * total / 40.0))
        if i > 0:
            a = (i - 1) * m; b = i * m
            for j in range(m):
                j2 = (j + 1) % m
                faces.append((a + j, a + j2, b + j2, b + j))
    # les deux bouts fermés
    faces.append(tuple(range(m - 1, -1, -1)))
    faces.append(tuple(range(ANNEAUX * m, ANNEAUX * m + m)))
    o = maillage(nom, verts, faces, mat, uvs, angle=60)
    return o, au

def tube(nom, points, rayon, mat, ferme=False, segments=16):
    """Un tube le long d'une polyligne (lissée)."""
    cu = bpy.data.curves.new(nom, "CURVE"); cu.dimensions = "3D"
    sp = cu.splines.new("NURBS"); sp.points.add(len(points) - 1)
    for i, p in enumerate(points): sp.points[i].co = (p[0], p[1], p[2], 1)
    sp.use_cyclic_u = ferme; sp.use_endpoint_u = not ferme; sp.order_u = 4
    cu.bevel_depth = rayon; cu.bevel_resolution = 4; cu.resolution_u = 12
    o = bpy.data.objects.new(nom, cu); bpy.context.scene.collection.objects.link(o)
    cu.materials.append(mat)
    return o

# --- matières --------------------------------------------------------------------------------------------------------
def materiau_cadran():
    m = bpy.data.materials.new("Cadran"); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(TEX, "cadran.png")); t.extension = "CLIP"
    # un peu plus chaud que la photo (le rendu neutre tire vers le rose)
    chaud = nt.nodes.new("ShaderNodeMix"); chaud.data_type = "RGBA"; chaud.blend_type = "MULTIPLY"; chaud.inputs["Factor"].default_value = 1.0
    chaud.inputs[7].default_value = (1.0, 0.965, 0.87, 1)
    nt.links.new(t.outputs["Color"], chaud.inputs[6]); nt.links.new(chaud.outputs[2], p.inputs["Base Color"])
    # les index dorés (un masque lissé, cadran.py) sont de l'or poli ; le cadran champagne, un métal satiné
    mi = nt.nodes.new("ShaderNodeTexImage"); mi.image = bpy.data.images.load(os.path.join(TEX, "cadran-index.png")); mi.image.colorspace_settings.name = "Non-Color"
    mi.extension = "CLIP"
    metal = nt.nodes.new("ShaderNodeMapRange"); metal.inputs["To Min"].default_value = 0.3; metal.inputs["To Max"].default_value = 1.0
    nt.links.new(mi.outputs["Color"], metal.inputs["Value"]); nt.links.new(metal.outputs["Result"], p.inputs["Metallic"])
    rug = nt.nodes.new("ShaderNodeMapRange"); rug.inputs["To Min"].default_value = 0.5; rug.inputs["To Max"].default_value = 0.14
    nt.links.new(mi.outputs["Color"], rug.inputs["Value"]); nt.links.new(rug.outputs["Result"], p.inputs["Roughness"])
    p.inputs["Anisotropic"].default_value = 0.5 if "Anisotropic" in p.inputs else 0
    return m

def materiau_cuir():
    m = bpy.data.materials.new("Cuir"); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(TEX, "cuir-couleur.png"))
    mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1.0, 1.25, 1)
    co = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(co.outputs["UV"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
    # un peu plus sombre et plus franc que la photo
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 1.0
    mix.inputs[7].default_value = (0.3, 0.3, 0.32, 1)
    nt.links.new(t.outputs["Color"], mix.inputs[6]); nt.links.new(mix.outputs[2], p.inputs["Base Color"])
    b = nt.nodes.new("ShaderNodeTexImage"); b.image = bpy.data.images.load(os.path.join(TEX, "cuir-relief.png")); b.image.colorspace_settings.name = "Non-Color"
    nt.links.new(mp.outputs["Vector"], b.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.9; bump.inputs["Distance"].default_value = 0.35
    nt.links.new(b.outputs["Color"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    p.inputs["Roughness"].default_value = 0.55; p.inputs["Specular IOR Level"].default_value = 0.4
    p.inputs["Coat Weight"].default_value = 0.35; p.inputs["Coat Roughness"].default_value = 0.1
    return m

def materiau_mouvement(mat_tripo):
    """La matière du mouvement de Tripo, refaite : sa texture cuite teintée par matière (acier, or, rubis), sa normale."""
    nt = mat_tripo.node_tree; p = nt.nodes.get("Principled BSDF")
    for n in list(nt.nodes):
        if n.type == "TEX_IMAGE" and n.image and "basecolor" in n.image.name: n.image = bpy.data.images.load(os.path.join(TEX, "mvt-base.png"))
        if n.type == "TEX_IMAGE" and n.image and ("_rm" in n.image.name or "metallicRoughness" in n.image.name):
            n.image = bpy.data.images.load(os.path.join(TEX, "mvt-rugosite.png")); n.image.colorspace_settings.name = "Non-Color"
    p.inputs["Metallic"].default_value = 1.0
    # la rugosité vient de la carte (par le séparateur déjà câblé par l'importateur) ; sinon valeur fixe
    if not p.inputs["Roughness"].is_linked: p.inputs["Roughness"].default_value = 0.3
    return mat_tripo

# --- la montre -------------------------------------------------------------------------------------------------------
class Montre:
    def __init__(self, sc):
        self.sc = sc
        or_ = A.or_poli("Or", (1.0, 0.76, 0.36), 0.14)
        or_mat = A.or_poli("OrSatine", (1.0, 0.74, 0.34), 0.3)
        acier_bleu = A.acier("AcierBleui", 0.22)
        acier_bleu.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.07, 0.08, 0.11, 1)
        verre = A.verre("Saphir")
        cadran = materiau_cadran()
        cuir = materiau_cuir()
        self.parts = {}
        def ajouter(cle, objs, axe, ecart):
            self.parts[cle] = dict(objs=objs if isinstance(objs, list) else [objs], axe=Vector(axe), ecart=ecart)
            for o in self.parts[cle]["objs"]:
                o["base"] = [list(r) for r in o.matrix_world]
        # le fond : l'anneau d'or (profil, puis le même 0,6 plus bas en retour) et sa glace saphir
        fond = PROFIL_FOND + [(r, z - 0.6) for r, z in reversed(PROFIL_FOND)]
        o_fond = tour("Fond", fond, or_mat)
        o_glace = tour("GlaceFond", [(12.95, -0.55), (12.95, -1.05), (0.001, -1.05), (0.001, -0.55)], verre, uv_v=None)
        ajouter("fond", [o_fond, o_glace], (0, 0, -1), 26)
        # la carrure : solide fermé (extérieur, puis l'intérieur en retour)
        carrure = PROFIL_CARRURE + [(15.6, 4.75), (15.6, 4.3), (12.55, 4.3), (12.55, 0.0), (18.25, 0.0)]
        o_carrure = tour("Carrure", carrure, or_)
        cornes = [corne(f"Corne{sx}{sy}", sx, sy, or_) for sx in (1, -1) for sy in (1, -1)]
        ajouter("boitier", [o_carrure] + cornes, (0, 0, 0), 0)
        # le mouvement (Tripo), face décorée vers le haut, dans la carrure
        bpy.ops.import_scene.gltf(filepath=MVT_GLB)
        mv = [o for o in bpy.data.objects if o.type == "MESH" and o.name.startswith("tripo")][0]
        mv.name = "Mouvement"
        materiau_mouvement(mv.data.materials[0])
        bpy.context.view_layer.update()
        mv.matrix_world = Matrix.Rotation(math.radians(-90), 4, "X") @ mv.matrix_world
        bpy.context.view_layer.update()
        mn, mx = A.boite(mv)
        d = (mx.x - mn.x)
        s = 2 * R_MVT / d
        mv.matrix_world = Matrix.Diagonal((s, s, s * 0.62, 1)) @ mv.matrix_world
        bpy.context.view_layer.update()
        mn, mx = A.boite(mv)
        mv.matrix_world = Matrix.Translation((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, Z_MVT[0] - mn.z)) @ mv.matrix_world
        bpy.context.view_layer.update()
        mn, mx = A.boite(mv)
        print("mouvement posé :", tuple(round(v, 2) for v in mn), tuple(round(v, 2) for v in mx))
        ajouter("mouvement", mv, (0, 0, 1), 24)
        # le cadran : un disque épais, sa face peinte dessus
        o_cadran = tour("CadranBord", [(R_CADRAN, Z_CADRAN), (R_CADRAN, Z_CADRAN + E_CADRAN)], or_mat, fermer=False)
        o_face = disque("Cadran", R_CADRAN, Z_CADRAN + E_CADRAN, cadran)
        o_dessous = disque("CadranDessous", R_CADRAN, Z_CADRAN, or_mat, uv=False, vers_bas=True)
        ajouter("cadran", [o_cadran, o_face, o_dessous], (0, 0, 1), 42)
        # les aiguilles (10 h 08, comme la photo), et le petit cadran des secondes à 6 h
        z_aig = Z_CADRAN + E_CADRAN + 0.5
        o_h = aiguille("Heures", 9.2, 1.9, acier_bleu); o_h.rotation_euler = (0, 0, math.radians(-304)); o_h.location = (0, 0, z_aig)
        o_m = aiguille("Minutes", 13.0, 1.7, acier_bleu); o_m.rotation_euler = (0, 0, math.radians(-50)); o_m.location = (0, 0, z_aig + 0.45)
        o_axe = tour("Pivot", [(0.001, z_aig - 0.4), (0.9, z_aig - 0.4), (0.9, z_aig + 0.9), (0.55, z_aig + 1.05), (0.001, z_aig + 1.05)], or_, segments=48, fermer=False)
        o_s = aiguille("PetiteSeconde", 3.3, 0.55, or_, queue=0.9, epaisseur=0.12); o_s.rotation_euler = (0, 0, math.radians(-235)); o_s.location = (0, -5.6, z_aig - 0.15)
        o_saxe = tour("PivotSeconde", [(0.001, z_aig - 0.4), (0.35, z_aig - 0.4), (0.35, z_aig + 0.25), (0.001, z_aig + 0.25)], or_, segments=32, fermer=False); o_saxe.location = (0, -5.6, 0)
        bpy.context.view_layer.update()
        ajouter("aiguilles", [o_h, o_m, o_axe], (0, 0, 1), 54)
        ajouter("petite-seconde", [o_s, o_saxe], (0, 0, 1), 50)
        # le verre bombé (une coque de 0,8), puis la lunette qui le serre
        ext = [(0.001, 6.15)] + [(15.9 * math.sin(a), 5.35 + 0.8 * math.cos(a) ** 1.0) for a in [math.radians(x) for x in (8, 16, 26, 38, 52, 66, 78, 86, 90)]]
        ext = [(0.001, 6.15), (3.5, 6.12), (7.0, 6.03), (10.0, 5.88), (12.5, 5.72), (14.3, 5.58), (15.4, 5.46), (15.9, 5.35)]
        inte = [(15.9, 5.1), (15.3, 4.8), (14.2, 4.92), (12.3, 5.05), (9.8, 5.17), (6.8, 5.28), (3.4, 5.35), (0.001, 5.38)]
        o_verre = tour("Verre", ext + inte, verre, fermer=True)
        ajouter("verre", o_verre, (0, 0, 1), 68)
        o_lunette = tour("Lunette", PROFIL_LUNETTE, or_)
        ajouter("lunette", o_lunette, (0, 0, 1), 82)
        # la couronne cannelée et sa tige, sur +X
        n = 30; cont = []
        for i in range(n * 4):
            a = 2 * math.pi * i / (n * 4)
            r = 2.25 - 0.12 * (0.5 + 0.5 * math.cos(a * n))
            cont.append((r * math.cos(a), r * math.sin(a)))
        o_cour = extruder("Couronne", cont, 0, 1.8, or_, biseau=0.3, segments_biseau=3)
        o_cour.rotation_euler = (0, math.radians(90), 0); o_cour.location = (R_BOITE + 0.3, 0, 2.9)
        o_tige = tour("Tige", [(0.001, 0), (0.75, 0), (0.75, 2.6), (0.001, 2.6)], or_mat, segments=32, fermer=False)
        o_tige.rotation_euler = (0, math.radians(90), 0); o_tige.location = (R_BOITE - 1.6, 0, 2.9)
        bpy.context.view_layer.update()
        ajouter("couronne", [o_cour, o_tige], (1, 0, 0), 14)
        # les bracelets, le passant, la boucle
        o_haut, _ = brin("BrinHaut", 1, 2.5, cuir)
        o_bas, au_bas = brin("BrinBas", -1, 2.9, cuir)
        barres = []
        for sens in (1, -1):
            b = tour(f"Barrette{sens}", [(0.001, -9.9), (0.6, -9.9), (0.6, 9.9), (0.001, 9.9)], A.acier("AcierBarre", 0.45), segments=24, fermer=False)
            b.rotation_euler = (0, math.radians(90), 0); b.location = (0, sens * 22.0, 2.3)
            barres.append(b)
        # la boucle au bout du brin du bas : un cadre arrondi, sa barre, son ardillon
        P1, T1 = au_bas(0.995)
        Nn = Vector((1, 0, 0)).cross(T1).normalized() * -1
        M = Matrix((Vector((1, 0, 0)), T1, Nn)).transposed().to_4x4()
        def dans_boucle(x, t, n):
            v = M @ Vector((x, t, n)); return (v.x + P1.x, v.y + P1.y, v.z + P1.z)
        cadre = []
        for k in range(48):
            a = 2 * math.pi * k / 48
            # un rectangle arrondi 22 × 16 en (x, t)
            cx, ct = 9.0 * math.copysign(1, math.cos(a)), 6.0 * math.copysign(1, math.sin(a))
            x = cx + 2.0 * math.cos(a); t = ct + 2.0 * math.sin(a)
            cadre.append(dans_boucle(x, t + 1.0, 1.2))
        o_cadre = tube("Boucle", cadre, 1.25, or_, ferme=True)
        o_barre = tube("BoucleBarre", [dans_boucle(-8.5, -7.0, 1.2), dans_boucle(8.5, -7.0, 1.2)], 0.9, or_)
        o_ard = tube("Ardillon", [dans_boucle(0, -6.8, 1.6), dans_boucle(0, -2.0, 2.4), dans_boucle(0, 6.5, 2.6), dans_boucle(0, 8.6, 1.4)], 0.8, or_)
        # le passant : une bande de cuir autour du brin, à 20 mm de la boucle
        P2, T2 = au_bas(0.80)
        N2 = Vector((1, 0, 0)).cross(T2).normalized() * -1
        M2 = Matrix((Vector((1, 0, 0)), T2, N2)).transposed().to_4x4()
        anneau = []
        for k in range(40):
            a = 2 * math.pi * k / 40
            x = 10.6 * math.copysign(1, math.cos(a)) * min(1, abs(math.cos(a)) * 1.6) if False else 0
            # un stade (rectangle aux bouts ronds) 22 × 5 autour de la section du brin
            cx = 9.2 * math.copysign(1, math.cos(a)); x = cx + 1.8 * math.cos(a); n = 0.4 + 2.2 * math.sin(a)
            v = M2 @ Vector((x, 0, n)); anneau.append((v.x + P2.x, v.y + P2.y, v.z + P2.z))
        o_passant = tube("Passant", anneau, 0.9, cuir, ferme=True)
        bpy.context.view_layer.update()
        ajouter("bracelet-haut", [o_haut, barres[0]], (0, 1, 0), 34)
        ajouter("bracelet-bas", [o_bas, barres[1], o_cadre, o_barre, o_ard, o_passant], (0, -1, 0), 34)
        self.plan = {
            "mouvement": (1, 0.12, 0.74), "fond": (2, 0.1, 0.56), "couronne": (2, 0.36, 0.8), "cadran": (3, 0.12, 0.72),
            "aiguilles": (4, 0.1, 0.58), "petite-seconde": (4, 0.3, 0.76), "verre": (5, 0.1, 0.58), "lunette": (5, 0.32, 0.8),
            "bracelet-haut": (6, 0.06, 0.46), "bracelet-bas": (6, 0.1, 0.5),
        }

    def poser(self, p):
        """Les pièces à l'instant p (0 à 1 sur la section) : chacune revient de son écart pendant son étape, avec un
        léger tassement à l'arrivée ; les pièces en attente flottent à peine."""
        S = 1 / 8
        for cle, part in self.parts.items():
            if cle not in self.plan:
                dep = Vector((0, 0, 0))
            else:
                k, de, a = self.plan[cle]
                t0, t1 = k * S + S * de, k * S + S * a
                q = borne((p - t0) / (t1 - t0))
                # une courbe : lente au départ, un rebond de 1,5 % à l'arrivée
                e = 1 - (1 - q) ** 3
                if q > 0.86 and q < 1: e = 1 + 0.015 * math.sin(math.pi * (q - 0.86) / 0.14) * (1 - q) / 0.14
                reste = (1 - e) * part["ecart"]
                flotte = 0.35 * math.sin(p * 37 + hash(cle) % 7) if q <= 0 else 0.0
                dep = part["axe"] * (reste + flotte)
            for o in part["objs"]:
                o.matrix_world = Matrix.Translation(dep) @ Matrix(o["base"])

def camera(sc, p, cam=None):
    """La caméra : de trois quarts au-dessus ; elle suit le centre de la pile qui se resserre, se relève et s'approche à
    la fin. Clés (p, z visé, élévation, distance, azimut)."""
    cles = [(0.0, 31, 27, 300, -6), (0.72, 18, 29, 262, -4), (0.80, 7, 34, 240, -2), (0.9, 2.5, 43, 232, 0), (1.0, 2.0, 44, 222, 0)]
    for i in range(len(cles) - 1):
        a, b = cles[i], cles[i + 1]
        if a[0] <= p <= b[0]:
            t = lisse(borne((p - a[0]) / (b[0] - a[0])))
            z, el, d, az = [a[j] + (b[j] - a[j]) * t for j in range(1, 5)]
            break
    el, az = math.radians(el), math.radians(az)
    vise = Vector((0, 0, z))
    pos = vise + Vector((d * math.cos(el) * math.sin(az), -d * math.cos(el) * math.cos(az), d * math.sin(el)))
    if cam is None:
        cam = A.camera(sc, pos, vise, focale=70)
        cam.data.sensor_fit = "VERTICAL"; cam.data.sensor_height = 36
    else:
        cam.location = pos; cam.rotation_euler = (vise - pos).to_track_quat("-Z", "Y").to_euler()
    return cam

def eclairage(sc):
    """Un studio produit : un ciel dégradé, une grande nappe derrière et au-dessus (elle se reflète dans les surfaces
    plates d'or vues de la caméra), une clé devant à gauche, un contre à droite."""
    A.ciel_studio(sc, haut=1.5, horizon=0.5, bas=0.1)
    A.lampe(sc, "Nappe", (0, 260, 330), (0, 0, 20), energie=160000, taille=260)
    A.lampe(sc, "Cle", (-200, -150, 230), (0, 0, 20), energie=110000, taille=150)
    A.lampe(sc, "Contre", (210, 60, 140), (0, 0, 20), energie=40000, taille=90)
    A.lampe(sc, "Face", (0, -300, 120), (0, 0, 20), energie=35000, taille=200)

def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    mode = args[0]
    sc = A.scene_vide()
    montre = Montre(sc)
    eclairage(sc)
    if mode == "dessus":
        sortie, p = args[1], float(args[2])
        A.rendu(sc, 600, 600, echantillons=32)
        montre.poser(p)
        cam = A.camera(sc, (0, 0, 300), (0, 0, 3), focale=70); cam.data.sensor_fit = "VERTICAL"; cam.data.sensor_height = 36
        cam.rotation_euler = (0, 0, 0)
        sc.render.filepath = sortie
        bpy.ops.render.render(write_still=True)
        return
    if mode == "test":
        sortie, liste = args[1], [float(v) for v in args[2].split(",")]
        l, h, ech = (int(args[3]), int(args[4]), int(args[5])) if len(args) > 5 else (540, 960, 48)
        A.rendu(sc, l, h, echantillons=ech)
        cam = None
        for p in liste:
            montre.poser(p); cam = camera(sc, p, cam)
            sc.render.filepath = os.path.join(sortie, f"p{int(round(p * 1000)):04d}.png")
            bpy.ops.render.render(write_still=True)
    else:
        dossier, n, de, a = args[1], int(args[2]), int(args[3]), int(args[4])
        l, h, ech = (int(args[5]), int(args[6]), int(args[7])) if len(args) > 7 else (810, 1440, 96)
        A.rendu(sc, l, h, echantillons=ech)
        os.makedirs(dossier, exist_ok=True)
        cam = None
        for k in range(de, a):
            p = k / (n - 1)
            montre.poser(p); cam = camera(sc, p, cam)
            sc.render.filepath = os.path.join(dossier, f"{k:03d}.png")
            if os.path.exists(sc.render.filepath): continue
            bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    main()
